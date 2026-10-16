import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const supabase = env.VITE_SUPABASE_URL ?? ''
  // GitHub Pages can't send headers, so the CSP ships as a meta tag (build only:
  // the dev server injects inline scripts). frame-ancestors needs a real header.
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} https://ipapi.co`,
    `frame-src 'self' blob: ${supabase}`,
    "object-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    // GitHub Pages serves the site from /Amaros/ (without this the page is
    // blank); Vercel serves it from the domain root and sets VERCEL=1.
    base: env.VERCEL ? '/' : '/Amaros/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'csp-meta',
        apply: 'build',
        transformIndexHtml: (html) =>
          html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
      },
    ],
  }
})
