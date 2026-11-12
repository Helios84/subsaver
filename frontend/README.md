# SubSaver frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Run locally

```bash
npm install
echo "BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```

The app runs at http://localhost:3000. API calls go to `/backend_api/*`, which `next.config.ts` proxies to `BACKEND_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | yes | Backend URL used by the proxy |
| `NEXT_PUBLIC_SITE_URL` | no | Public site URL for Open Graph links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Contact address; contact links are hidden when unset |

See the [root README](../README.md) for the full project description.
