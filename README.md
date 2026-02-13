# App Aquile Admin

Pannello web per creare e pubblicare articoli dell'app mobile App Aquile.

## Stack

- React + Vite
- Supabase (`@supabase/supabase-js`)
- Editor contenuti: `react-quill`
- Deploy: Netlify (automatico da GitHub Actions su branch `prod`)

## Branch strategy

- `main`: sviluppo e prove locali
- `prod`: branch di produzione (deploy automatico)

Flusso:

1. lavori su `main`
2. apri PR `main -> prod`
3. GitHub Actions fa build di verifica sulla PR
4. al merge su `prod`, parte deploy automatico su Netlify

## Configurazione locale

Requisiti:

- Node.js `20.19+`

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

## Build produzione

```bash
npm run build
```

Output: `dist/`

## CI/CD (GitHub Actions)

Workflows inclusi:

- `.github/workflows/pr-build.yml`
  - trigger: `pull_request` su branch `prod`
  - esegue install + build
- `.github/workflows/deploy-prod.yml`
  - trigger: `push` su branch `prod`
  - esegue build e deploy su Netlify

## Secrets GitHub necessari

Nel repository GitHub (Settings -> Secrets and variables -> Actions), aggiungere:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

## Link utili

- Supabase dashboard: `https://supabase.com/dashboard/project/ivjtugjpxdvtjipaohuw`
- Netlify app: `https://app.netlify.com/`
- URL admin in produzione: `https://sq-aquile.netlify.app/`
