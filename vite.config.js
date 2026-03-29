import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages: set base to '/<repo-name>/'
// Change this if your repo has a different name
export default defineConfig({
  plugins: [react()],
  base: '/healthiersg-checker/',
  build: {
    outDir: 'dist',
  },
});
