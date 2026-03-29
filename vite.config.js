import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE_PATH when hosting under a subpath (e.g. GitHub Pages project site).
// Vercel / Netlify / custom domain at root: leave unset (defaults to '/').
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
