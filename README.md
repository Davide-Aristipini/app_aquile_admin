# App Aquile Admin

Pannello web per creare e pubblicare articoli dell'app mobile App Aquile.

## Stack

- Angular 19 (standalone components + router)
- Supabase (`@supabase/supabase-js`)
- Editor contenuti: Quill (`ngx-quill`)
- Deploy: Netlify (build diretto dal branch `prod`)

## Branch strategy

- `main`: sviluppo
- `prod`: produzione

Flusso consigliato:

1. lavori su `main`
2. merge `main -> prod`
3. Netlify esegue build e publish da `prod`

## Configurazione locale

Requisiti:

- Node.js `20.19+` consigliato

Comandi:

```bash
npm install
cp .env.example .env
npm run dev
```

### Variabili ambiente

`/.env`:

```env
VITE_SUPABASE_URL=https://ivjtugjpxdvtjipaohuw.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

Nota: `npm run build` esegue `scripts/write-env.mjs`, che genera `src/environments/environment.ts` partendo da `.env` o dalle variabili d'ambiente della CI.

## Build produzione

```bash
npm run build
```

Output Angular: `dist/browser`

## Netlify

Configurazione inclusa in `netlify.toml`:

- build command: `npm run build`
- publish directory: `dist/browser`
- redirect SPA: `/* -> /index.html`

## Link utili

- Supabase dashboard: `https://supabase.com/dashboard/project/ivjtugjpxdvtjipaohuw`
- Netlify app: `https://app.netlify.com/`
- URL admin in produzione: `https://sq-aquile.netlify.app/`
