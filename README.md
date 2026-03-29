# HealthierSG Eligibility Checker

A web application for Singapore residents to check their HealthierSG screening and vaccination eligibility. Simulates a Singpass login flow and displays personalised results based on age and gender.

![HealthierSG Checker](https://img.shields.io/badge/HealthierSG-Eligibility%20Checker-0F6E56?style=for-the-badge)

## Features

- **Realistic Singpass mock login** — QR code display and demo profile selection
- **Health screening eligibility** — Cardiovascular, cervical cancer, colorectal cancer, and breast cancer screening recommendations
- **Vaccination schedule (NAIS)** — All 8 nationally recommended vaccines with age/gender filtering
- **Subsidy calculator** — Full breakdown for PG, MG, CHAS Blue/Orange, CHAS Green, HealthierSG-enrolled, and PR tiers
- **Official booking links** — Direct links to Health Appointment System and vaccine.gov.sg

## Data Sources

- [MOH — HealthierSG Screening](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/healthier-sg-screening/)
- [HealthHub — Healthier SG Screening](https://www.healthhub.sg/programmes/healthiersg-screening)
- [NAIS Schedule (updated Aug 2025)](https://www.cda.gov.sg/public/vaccinations/)
- [MOH — NAIS Subsidies](https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-national-adult-immunisation-schedule-(nais)-vaccines-administered-at-public-healthcare-settings/)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

### Option A: Automatic (GitHub Actions)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` will auto-deploy on every push to `main`
4. Your app will be live at `https://<username>.github.io/healthiersg-checker/`

### Option B: Manual (gh-pages)

```bash
# One-command deploy
npm run deploy
```

> **Note:** Update the `base` path in `vite.config.js` if your repo name is different.

## Disclaimer

This is a demonstration application. Eligibility results are based on general age and gender criteria from MOH/HPB guidelines and do not account for pre-existing conditions, last screening dates, or individual medical history.

## License

MIT
