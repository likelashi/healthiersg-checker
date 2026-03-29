import { useState, useEffect, useCallback, useRef } from "react";

// ─── Data: Screening eligibility rules ───
const SCREENING_RULES = [
  {
    id: "cvd",
    name: "Cardiovascular risk screening",
    description: "Screens for obesity, high blood pressure, high cholesterol, and diabetes",
    tests: ["Blood pressure", "Body mass index (BMI)", "Fasting blood glucose", "Fasting lipid panel"],
    frequency: "Once every 3 years",
    eligible: (age, gender) => age >= 40,
    note: "For ages 18–39, take the Diabetes Risk Assessment (DRA). If assessed 'at higher risk', you qualify for subsidised cardiovascular screening.",
  },
  {
    id: "cervical",
    name: "Cervical cancer screening (Pap test)",
    description: "Detects abnormal cervical cell changes early",
    tests: ["Pap smear"],
    frequency: "Once every 3 years",
    eligible: (age, gender) => gender === "Female" && age >= 25 && age <= 29,
    note: "HPV test is not recommended for this age group as most infections clear naturally.",
  },
  {
    id: "cervical_hpv",
    name: "Cervical cancer screening (HPV test)",
    description: "Detects high-risk HPV strains that may cause cervical cancer",
    tests: ["HPV test (or Pap + HPV co-testing)"],
    frequency: "Once every 5 years",
    eligible: (age, gender) => gender === "Female" && age >= 30 && age <= 69,
    note: "Both Pap and HPV tests can be done from the same sample.",
  },
  {
    id: "colorectal",
    name: "Colorectal cancer screening",
    description: "Detects early signs of colorectal cancer — Singapore's top cancer",
    tests: ["Faecal Immunochemical Test (FIT)"],
    frequency: "Once every year",
    eligible: (age, gender) => age >= 50,
    note: "FIT is a simple, non-invasive test you can do at home. A positive result requires further evaluation (e.g. colonoscopy).",
  },
  {
    id: "breast",
    name: "Breast cancer screening",
    description: "Mammogram to detect breast cancer early — the #1 women's cancer in Singapore",
    tests: ["Screening mammogram"],
    frequency: "Once every 2 years",
    eligible: (age, gender) => gender === "Female" && age >= 50 && age <= 69,
    note: "Women aged 40–49 may discuss benefits and limitations of mammography with their doctor.",
  },
  {
    id: "breast_consult",
    name: "Breast cancer screening (with doctor discussion)",
    description: "Discuss benefits and limitations of mammography for your age group",
    tests: ["Screening mammogram (after consultation)"],
    frequency: "Once every year (if recommended)",
    eligible: (age, gender) => gender === "Female" && age >= 40 && age <= 49,
    note: "Mammography is not routinely recommended at this age. Your doctor can assess your individual risk.",
  },
];

// ─── Data: Vaccination rules (NAIS updated Aug 2025) ───
const VACCINATION_RULES = [
  {
    id: "influenza",
    name: "Influenza (Flu)",
    description: "Protects against seasonal influenza complications",
    doses: "1 dose annually",
    eligible: (age, gender) => age >= 18,
    priority: (age) => age >= 65 ? "high" : "standard",
    priorityNote: (age) => age >= 65 ? "Strongly recommended for all persons 65+" : "Recommended for those with chronic conditions or at increased risk",
  },
  {
    id: "pneumococcal",
    name: "Pneumococcal (PCV20)",
    description: "Prevents pneumonia and severe pneumococcal disease",
    doses: "1 dose of PCV20",
    eligible: (age, gender) => age >= 65,
    priority: () => "high",
    priorityNote: () => "Recommended for all persons 65+. Those 18–64 with chronic conditions may also qualify.",
  },
  {
    id: "shingles",
    name: "Shingles (Shingrix / RHZV)",
    description: "Prevents shingles and its complications (post-herpetic neuralgia)",
    doses: "2 doses (2–6 months apart)",
    eligible: (age, gender) => age >= 60,
    priority: () => "high",
    priorityNote: () => "Added to NAIS from Sep 2025. Adults 18–59 with immunocompromising conditions may also qualify.",
  },
  {
    id: "tdap",
    name: "Tdap (Tetanus, Diphtheria, Pertussis)",
    description: "Protects mother and newborn from pertussis (whooping cough)",
    doses: "1 dose during each pregnancy (weeks 16–32)",
    eligible: (age, gender) => gender === "Female" && age >= 18 && age <= 45,
    priority: () => "standard",
    priorityNote: () => "Recommended during 16–32 weeks of each pregnancy regardless of previous vaccination.",
  },
  {
    id: "hpv",
    name: "HPV (Cervarix)",
    description: "Prevents HPV infection that can lead to cervical cancer",
    doses: "3 doses (0, 1, 6 months)",
    eligible: (age, gender) => gender === "Female" && age >= 18 && age <= 26,
    priority: () => "high",
    priorityNote: () => "If started but not completed by age 26, remaining doses may be given up to age 45.",
  },
  {
    id: "hepb",
    name: "Hepatitis B",
    description: "Prevents serious viral liver infection spread through blood/bodily fluids",
    doses: "3 doses (0, 1, 6 months)",
    eligible: (age, gender) => age >= 18,
    priority: () => "catchup",
    priorityNote: () => "Recommended if no evidence of immunity or prior vaccination.",
  },
  {
    id: "mmr",
    name: "Measles, Mumps & Rubella (MMR)",
    description: "Prevents measles, mumps, and rubella — which can cause serious complications in adults",
    doses: "2 doses (at least 4 weeks apart)",
    eligible: (age, gender) => age >= 18,
    priority: () => "catchup",
    priorityNote: () => "Recommended if not previously vaccinated or lacking evidence of immunity.",
  },
  {
    id: "varicella",
    name: "Varicella (Chickenpox)",
    description: "Prevents chickenpox — effects are often more serious in adults than children",
    doses: "2 doses (4–8 weeks apart)",
    eligible: (age, gender) => age >= 18,
    priority: () => "catchup",
    priorityNote: () => "Recommended if no evidence of prior infection or vaccination.",
  },
];

// ─── Data: Subsidy tiers ───
const SUBSIDY_TIERS = [
  { id: "hsg_enrolled", label: "HealthierSG-enrolled SC", screening: "$0", mammogram: "$0", color: "#0F6E56" },
  { id: "pg", label: "Pioneer Generation", screening: "$0", mammogram: "$25", color: "#185FA5" },
  { id: "mg", label: "Merdeka Generation", screening: "$2", mammogram: "$37.50", color: "#534AB7" },
  { id: "chas_bo", label: "CHAS Blue / Orange", screening: "$2", mammogram: "$50*", color: "#D85A30" },
  { id: "chas_green", label: "CHAS Green / Other SC", screening: "$5", mammogram: "$50*", color: "#993C1D" },
  { id: "pr", label: "Permanent Resident", screening: "Varies", mammogram: "$75", color: "#5F5E5A" },
];

// ─── Demo profiles ───
const DEMO_PROFILES = [
  { name: "Tan Mei Ling", nric: "S****567A", dob: "1975-06-15", gender: "Female", tier: "hsg_enrolled" },
  { name: "Ahmad bin Ismail", nric: "S****234B", dob: "1960-03-22", gender: "Male", tier: "pg" },
  { name: "Priya Devi", nric: "S****891C", dob: "1998-11-08", gender: "Female", tier: "chas_green" },
  { name: "Lim Wei Ming", nric: "S****456D", dob: "1955-01-30", gender: "Male", tier: "mg" },
];

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Singpass QR Code SVG ───
function QRCodeSVG() {
  const size = 160;
  const cells = 21;
  const cellSize = size / cells;
  const rects = [];
  const pattern = useRef(null);
  if (!pattern.current) {
    const grid = Array.from({ length: cells }, () => Array(cells).fill(false));
    const setBlock = (r, c, s) => {
      for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) grid[r + i][c + j] = true;
    };
    // finder patterns
    [
      [0, 0], [0, 14], [14, 0]
    ].forEach(([r, c]) => {
      setBlock(r, c, 7);
      for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) grid[r + i][c + j] = false;
      setBlock(r + 2, c + 2, 3);
    });
    // random data
    for (let i = 0; i < cells; i++)
      for (let j = 0; j < cells; j++)
        if (!grid[i][j] && Math.random() > 0.55) grid[i][j] = true;
    pattern.current = grid;
  }
  const grid = pattern.current;
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++)
      if (grid[i][j])
        rects.push(
          <rect key={`${i}-${j}`} x={j * cellSize} y={i * cellSize} width={cellSize + 0.5} height={cellSize + 0.5} rx={0.5} />
        );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <g fill="var(--color-text-primary)">{rects}</g>
    </svg>
  );
}

// ─── Icon components ───
function ShieldIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function HeartIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SyringeIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 2 4 4" /><path d="m17 7 3-3" /><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" /><path d="m5 19-3 3" /><path d="m14 4 6 6" />
    </svg>
  );
}

function CheckCircle({ size = 18, color = "#0F6E56" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function InfoIcon({ size = 16, color = "var(--color-text-secondary)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ChevronRight({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ExternalLink({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ClockIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Main App ───
export default function HealthierSGApp() {
  const [screen, setScreen] = useState("landing"); // landing | singpass | loading | dashboard
  const [profile, setProfile] = useState(null);
  const [selectedTier, setSelectedTier] = useState("hsg_enrolled");
  const [expandedCard, setExpandedCard] = useState(null);
  const [animIn, setAnimIn] = useState(false);

  const goToSingpass = () => {
    setScreen("singpass");
    setTimeout(() => setAnimIn(true), 50);
  };

  const selectProfile = (p) => {
    setProfile(p);
    setSelectedTier(p.tier);
    setAnimIn(false);
    setScreen("loading");
    setTimeout(() => {
      setScreen("dashboard");
      setTimeout(() => setAnimIn(true), 50);
    }, 2200);
  };

  const logout = () => {
    setScreen("landing");
    setProfile(null);
    setAnimIn(false);
    setExpandedCard(null);
  };

  if (screen === "landing") return <LandingScreen onLogin={goToSingpass} />;
  if (screen === "singpass") return <SingpassScreen onSelect={selectProfile} animIn={animIn} onBack={() => { setScreen("landing"); setAnimIn(false); }} />;
  if (screen === "loading") return <LoadingScreen profile={profile} />;
  return (
    <DashboardScreen
      profile={profile}
      tier={selectedTier}
      onTierChange={setSelectedTier}
      expandedCard={expandedCard}
      setExpandedCard={setExpandedCard}
      animIn={animIn}
      onLogout={logout}
    />
  );
}

// ─── Landing Screen ───
function LandingScreen({ onLogin }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 100); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(168deg, #f0faf6 0%, #ffffff 40%, #fff5f3 100%)",
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .fade-up { opacity: 0; animation: fadeUp 0.7s ease forwards; }
        .singpass-btn {
          display: flex; align-items: center; gap: 12px;
          background: #F4333D; color: #fff; border: none; border-radius: 12px;
          padding: 16px 32px; font-size: 16px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
          box-shadow: 0 4px 16px rgba(244,51,61,0.25);
        }
        .singpass-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(244,51,61,0.35); }
        .singpass-btn:active { transform: translateY(0); }
        .feature-card {
          background: #fff; border-radius: 16px; padding: 24px;
          border: 1px solid #e8e6e1; transition: all 0.25s;
        }
        .feature-card:hover { border-color: #0F6E56; box-shadow: 0 4px 20px rgba(15,110,86,0.08); }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 32px", maxWidth: 1080, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#0F6E56",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <HeartIcon size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#1a1a18", letterSpacing: -0.3 }}>
            HealthierSG
          </span>
        </div>
        <a href="https://www.healthiersg.gov.sg" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: "#5F5E5A", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Official site <ExternalLink size={12} />
        </a>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "60px 32px 40px" }}>
        <div className="fade-up" style={{ animationDelay: "0.1s", maxWidth: 580 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#e6f5ef", borderRadius: 20, padding: "6px 14px",
            fontSize: 12, fontWeight: 600, color: "#0F6E56", marginBottom: 20,
            letterSpacing: 0.3, textTransform: "uppercase",
          }}>
            <ShieldIcon size={14} color="#0F6E56" /> Free eligibility check
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 46, lineHeight: 1.12,
            color: "#1a1a18", marginBottom: 16, letterSpacing: -0.5,
          }}>
            Check your<br />
            <span style={{ color: "#0F6E56" }}>HealthierSG</span> screening<br />
            & vaccination eligibility
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.65, color: "#5F5E5A", marginBottom: 36, maxWidth: 480 }}>
            Log in with Singpass to instantly see which subsidised screenings and vaccinations you're eligible for — based on your age and gender.
          </p>

          <button className="singpass-btn" onClick={onLogin}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" fill="#fff" fillOpacity="0.2"/>
              <path d="M7 8h10M7 12h7M7 16h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Log in with Singpass
          </button>

          <p style={{ fontSize: 12, color: "#888780", marginTop: 14 }}>
            This is a demo application. No real Singpass authentication occurs.
          </p>
        </div>

        {/* Feature cards */}
        <div className="fade-up" style={{
          animationDelay: "0.4s",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16, marginTop: 56,
        }}>
          {[
            { icon: <HeartIcon size={22} color="#0F6E56" />, title: "Health screenings", desc: "Cardiovascular, cervical, colorectal & breast cancer" },
            { icon: <SyringeIcon size={22} color="#185FA5" />, title: "Vaccinations", desc: "Full NAIS schedule — flu, pneumococcal, shingles & more" },
            { icon: <ShieldIcon size={22} color="#534AB7" />, title: "Subsidy calculator", desc: "See exact costs for PG, MG, CHAS and HealthierSG tiers" },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a18", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#888780", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "40px 32px 24px", fontSize: 12, color: "#B4B2A9" }}>
        Demo application for illustration purposes only. Data based on MOH/HPB guidelines.
      </div>
    </div>
  );
}

// ─── Singpass Screen ───
function SingpassScreen({ onSelect, animIn, onBack }) {
  const [tab, setTab] = useState("qr"); // qr | profiles
  const [qrLoaded, setQrLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setQrLoaded(true), 800); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f8f8f6 0%, #ffffff 100%)",
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sp-card { animation: fadeIn 0.4s ease; }
        .profile-btn {
          display: flex; align-items: center; gap: 14px; width: 100%;
          padding: 14px 16px; border-radius: 12px; border: 1px solid #e8e6e1;
          background: #fff; cursor: pointer; transition: all 0.2s; text-align: left;
          font-family: inherit;
        }
        .profile-btn:hover { border-color: #F4333D; background: #fff8f8; transform: translateX(4px); }
        .tab-btn {
          flex: 1; padding: 10px; border: none; background: none; cursor: pointer;
          font-size: 14px; font-weight: 500; color: #888780; border-bottom: 2px solid transparent;
          transition: all 0.2s; font-family: inherit;
        }
        .tab-btn.active { color: #F4333D; border-bottom-color: #F4333D; }
      `}</style>

      <div className="sp-card" style={{
        width: "100%", maxWidth: 420,
        background: "#fff", borderRadius: 20, overflow: "hidden",
        border: "1px solid #e8e6e1",
        boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
      }}>
        {/* Singpass header */}
        <div style={{
          background: "#F4333D", padding: "28px 24px 20px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="5" fill="#fff" fillOpacity="0.25"/>
              <path d="M7 8h10M7 12h7M7 16h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: -0.3 }}>Singpass</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Log in to HealthierSG Eligibility Checker</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e6e1" }}>
          <button className={`tab-btn ${tab === "qr" ? "active" : ""}`} onClick={() => setTab("qr")}>
            QR Login
          </button>
          <button className={`tab-btn ${tab === "profiles" ? "active" : ""}`} onClick={() => setTab("profiles")}>
            Demo Profiles
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {tab === "qr" ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#5F5E5A", marginBottom: 20, lineHeight: 1.5 }}>
                Open your <strong>Singpass app</strong> and scan this QR code
              </p>
              <div style={{
                display: "inline-flex", padding: 16, borderRadius: 16,
                background: "#fafaf8", border: "1px solid #e8e6e1",
                position: "relative",
              }}>
                <QRCodeSVG />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.7)", borderRadius: 16,
                  opacity: qrLoaded ? 0 : 1, transition: "opacity 0.5s",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: 24, height: 24, border: "3px solid #e8e6e1",
                    borderTopColor: "#F4333D", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}/>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#B4B2A9", marginTop: 16, lineHeight: 1.5 }}>
                This is a demo. Select a <strong>Demo Profile</strong> to continue.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: "#5F5E5A", marginBottom: 16, lineHeight: 1.5 }}>
                Select a demo profile to simulate Singpass login:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DEMO_PROFILES.map((p, i) => {
                  const age = calculateAge(p.dob);
                  const tierInfo = SUBSIDY_TIERS.find(t => t.id === p.tier);
                  return (
                    <button key={i} className="profile-btn" onClick={() => onSelect(p)}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${tierInfo.color}22, ${tierInfo.color}44)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 600, fontSize: 15, color: tierInfo.color, flexShrink: 0,
                      }}>
                        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a18" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>
                          {p.gender}, {age} yrs — {tierInfo.label}
                        </div>
                      </div>
                      <ChevronRight size={18} color="#B4B2A9" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Back */}
        <div style={{ padding: "0 24px 20px", textAlign: "center" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", color: "#888780",
            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            padding: "8px 16px", borderRadius: 8, transition: "color 0.2s",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Screen ───
function LoadingScreen({ profile }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Retrieving Singpass profile...",
    "Checking screening eligibility...",
    "Loading vaccination schedule...",
    "Calculating subsidies...",
  ];
  useEffect(() => {
    const timers = steps.map((_, i) => setTimeout(() => setStep(i), i * 500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "#fafaf8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div style={{
        width: 56, height: 56, borderRadius: 14, background: "#0F6E56",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
      }}>
        <div style={{
          width: 28, height: 28, border: "3px solid rgba(255,255,255,0.3)",
          borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }}/>
      </div>

      <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a18", marginBottom: 8 }}>
        Welcome, {profile?.name?.split(" ")[0]}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            fontSize: 13, color: i <= step ? "#0F6E56" : "#B4B2A9",
            display: "flex", alignItems: "center", gap: 8,
            opacity: i <= step ? 1 : 0.4, transition: "all 0.3s",
          }}>
            {i < step ? <CheckCircle size={16} color="#0F6E56" /> :
             i === step ? <div style={{
               width: 16, height: 16, border: "2px solid #e8e6e1",
               borderTopColor: "#0F6E56", borderRadius: "50%", animation: "spin 0.8s linear infinite",
             }}/> : <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e8e6e1" }} />}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Screen ───
function DashboardScreen({ profile, tier, onTierChange, expandedCard, setExpandedCard, animIn, onLogout }) {
  const age = calculateAge(profile.dob);
  const gender = profile.gender;
  const tierInfo = SUBSIDY_TIERS.find(t => t.id === tier);

  const eligibleScreenings = SCREENING_RULES.filter(r => r.eligible(age, gender));
  const eligibleVaccinations = VACCINATION_RULES.filter(r => r.eligible(age, gender));
  const highPriorityVax = eligibleVaccinations.filter(v => v.priority(age) === "high");
  const standardVax = eligibleVaccinations.filter(v => v.priority(age) === "standard");
  const catchupVax = eligibleVaccinations.filter(v => v.priority(age) === "catchup");

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "#fafaf8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { opacity: 0; animation: fadeUp 0.5s ease forwards; }
        .screen-card {
          background: #fff; border-radius: 14px; padding: 20px;
          border: 1px solid #e8e6e1; transition: all 0.25s; cursor: pointer;
        }
        .screen-card:hover { border-color: #c8c6c0; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .screen-card.expanded { border-color: #0F6E56; box-shadow: 0 4px 20px rgba(15,110,86,0.08); }
        .vax-card {
          background: #fff; border-radius: 12px; padding: 16px;
          border: 1px solid #e8e6e1; transition: all 0.25s;
        }
        .vax-card:hover { border-color: #c8c6c0; }
        .tier-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; border: 2px solid transparent;
          font-family: inherit;
        }
        .tier-pill.active { border-color: currentColor; }
        .tier-pill:not(.active) { opacity: 0.5; }
        .tier-pill:hover { opacity: 1; }
        .badge-high { background: #e6f5ef; color: #0F6E56; }
        .badge-standard { background: #E6F1FB; color: #185FA5; }
        .badge-catchup { background: #F1EFE8; color: #5F5E5A; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #888780; margin-bottom: 12px; }
        .test-tag { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; background: #f5f5f2; color: #5F5E5A; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e6e1" }}>
        <div style={{
          maxWidth: 800, margin: "0 auto", padding: "14px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#0F6E56",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <HeartIcon size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a18" }}>HealthierSG</span>
          </div>
          <button onClick={onLogout} style={{
            background: "none", border: "1px solid #e8e6e1", borderRadius: 8,
            padding: "6px 14px", fontSize: 13, color: "#5F5E5A", cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
          }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* Profile card */}
        <div className="animate-in" style={{ animationDelay: "0.1s" }}>
          <div style={{
            background: "linear-gradient(135deg, #0F6E56 0%, #0a5440 100%)",
            borderRadius: 18, padding: "28px 28px 24px", color: "#fff", marginBottom: 28,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Singpass verified</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{profile.name}</div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  NRIC: {profile.nric} &middot; {gender} &middot; {age} years old
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.15)", borderRadius: 10,
                  padding: "8px 14px", fontSize: 13, fontWeight: 600,
                }}>
                  <CheckCircle size={16} color="#7DF2C7" />
                  {tierInfo.label}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
              marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.15)",
            }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{eligibleScreenings.length}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Screenings eligible</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{eligibleVaccinations.length}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Vaccines recommended</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{tierInfo.screening}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Screening cost</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subsidy tier selector */}
        <div className="animate-in" style={{ animationDelay: "0.2s", marginBottom: 28 }}>
          <div className="section-title">Subsidy tier</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUBSIDY_TIERS.map(t => (
              <button
                key={t.id}
                className={`tier-pill ${tier === t.id ? "active" : ""}`}
                style={{ color: t.color, background: `${t.color}12` }}
                onClick={() => onTierChange(t.id)}
              >
                <div style={{ width: 8, height: 8, borderRadius: 4, background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
          <div style={{
            marginTop: 12, padding: "12px 16px", background: "#fff",
            borderRadius: 10, border: "1px solid #e8e6e1", fontSize: 13, color: "#5F5E5A",
            display: "flex", gap: 16, flexWrap: "wrap",
          }}>
            <span>Screening: <strong style={{ color: tierInfo.color }}>{tierInfo.screening}</strong></span>
            <span>Mammogram: <strong style={{ color: tierInfo.color }}>{tierInfo.mammogram}</strong></span>
            <span style={{ fontSize: 11, color: "#B4B2A9" }}>*At selected polyclinics</span>
          </div>
        </div>

        {/* Screenings section */}
        <div className="animate-in" style={{ animationDelay: "0.3s", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#e6f5ef",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <HeartIcon size={16} color="#0F6E56" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a18" }}>Health screenings</div>
              <div style={{ fontSize: 12, color: "#888780" }}>Based on your age ({age}) and gender ({gender.toLowerCase()})</div>
            </div>
          </div>

          {eligibleScreenings.length === 0 ? (
            <div style={{
              background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e8e6e1",
              textAlign: "center", color: "#888780",
            }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>No routine screenings currently recommended for your profile.</div>
              <div style={{ fontSize: 12 }}>
                If you're 18–39, consider taking the <strong>Diabetes Risk Assessment (DRA)</strong> to check if you qualify for subsidised cardiovascular screening.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {eligibleScreenings.map((s, i) => {
                const isExpanded = expandedCard === s.id;
                return (
                  <div
                    key={s.id}
                    className={`screen-card ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpandedCard(isExpanded ? null : s.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <CheckCircle size={18} color="#0F6E56" />
                          <span style={{ fontWeight: 600, fontSize: 15, color: "#1a1a18" }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#5F5E5A", lineHeight: 1.5, marginLeft: 26 }}>
                          {s.description}
                        </div>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: "#888780", whiteSpace: "nowrap",
                        marginLeft: 12,
                      }}>
                        <ClockIcon size={13} /> {s.frequency}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0eeea",
                        animation: "fadeUp 0.3s ease",
                      }}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#888780", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Tests included</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {s.tests.map((t, j) => (
                              <span key={j} className="test-tag">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 8,
                          padding: "10px 14px", background: "#fafaf8", borderRadius: 10,
                          fontSize: 12, color: "#5F5E5A", lineHeight: 1.5,
                        }}>
                          <InfoIcon size={16} color="#888780" />
                          <span>{s.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vaccinations section */}
        <div className="animate-in" style={{ animationDelay: "0.4s", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#E6F1FB",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SyringeIcon size={16} color="#185FA5" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a18" }}>Vaccinations (NAIS)</div>
              <div style={{ fontSize: 12, color: "#888780" }}>National Adult Immunisation Schedule — updated Aug 2025</div>
            </div>
          </div>

          {/* High priority */}
          {highPriorityVax.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F6E56", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#0F6E56" }} />
                Recommended for your age group
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {highPriorityVax.map(v => (
                  <VaxCard key={v.id} vax={v} age={age} badgeClass="badge-high" />
                ))}
              </div>
            </div>
          )}

          {/* Standard */}
          {standardVax.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#185FA5", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#185FA5" }} />
                Conditionally recommended
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {standardVax.map(v => (
                  <VaxCard key={v.id} vax={v} age={age} badgeClass="badge-standard" />
                ))}
              </div>
            </div>
          )}

          {/* Catch-up */}
          {catchupVax.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#888780" }} />
                Catch-up (if not previously vaccinated)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {catchupVax.map(v => (
                  <VaxCard key={v.id} vax={v} age={age} badgeClass="badge-catchup" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA + links */}
        <div className="animate-in" style={{ animationDelay: "0.5s" }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24,
            border: "1px solid #e8e6e1", textAlign: "center",
          }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a18", marginBottom: 8 }}>
              Ready to take action?
            </div>
            <p style={{ fontSize: 13, color: "#5F5E5A", marginBottom: 20, lineHeight: 1.6 }}>
              Book your screening or vaccination appointment through the Health Appointment System.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://book.health.gov.sg/healthiersg-screening" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0F6E56", color: "#fff", borderRadius: 10,
                  padding: "12px 24px", fontSize: 14, fontWeight: 600,
                  textDecoration: "none", transition: "all 0.2s",
                }}>
                Book screening <ExternalLink size={14} color="#fff" />
              </a>
              <a href="https://vaccine.gov.sg" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#185FA5", color: "#fff", borderRadius: 10,
                  padding: "12px 24px", fontSize: 14, fontWeight: 600,
                  textDecoration: "none", transition: "all 0.2s",
                }}>
                Book vaccination <ExternalLink size={14} color="#fff" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 24, padding: "16px 20px", background: "#fff8f3",
          borderRadius: 12, border: "1px solid #F5C4B3", fontSize: 12,
          color: "#712B13", lineHeight: 1.6,
        }}>
          <strong>Disclaimer:</strong> This is a demonstration application. Eligibility results are based on general age and gender criteria from MOH/HPB guidelines and do not account for pre-existing conditions, last screening dates, or individual medical history. Please consult your Healthier SG enrolled clinic or visit <a href="https://www.healthhub.sg/programmes/healthiersg-screening" target="_blank" rel="noopener noreferrer" style={{ color: "#993C1D" }}>HealthHub</a> for your actual eligibility.
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#B4B2A9" }}>
          Data sources: MOH, HPB, CDA — HealthierSG Screening & NAIS (updated Aug 2025)
        </div>
      </div>
    </div>
  );
}

// ─── Vaccination Card ───
function VaxCard({ vax, age, badgeClass }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="vax-card" onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a18" }}>{vax.name}</div>
        <span className={badgeClass} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
          {vax.priority(age) === "high" ? "Recommended" : vax.priority(age) === "catchup" ? "Catch-up" : "Conditional"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#5F5E5A", marginTop: 6, lineHeight: 1.5 }}>{vax.description}</div>
      <div style={{ fontSize: 12, color: "#888780", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <SyringeIcon size={12} color="#888780" /> {vax.doses}
      </div>
      {expanded && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0eeea",
          fontSize: 12, color: "#5F5E5A", lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 6,
        }}>
          <InfoIcon size={14} color="#888780" />
          <span>{vax.priorityNote(age)}</span>
        </div>
      )}
    </div>
  );
}
