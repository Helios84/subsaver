# SubSaver frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Run locally

```bash
npm install
echo "BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```

The app runs at http://localhost:3000. API calls go to `/backend_api/*`, which the route handler in `app/backend_api/[...path]/route.ts` forwards to `BACKEND_URL`.

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
| `PROXY_SHARED_SECRET` | no | Secret shared with the backend; leave empty locally |
| `NEXT_PUBLIC_SITE_URL` | no | Public site URL for Open Graph links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Contact address; contact links are hidden when unset |
| `NEXT_PUBLIC_DEMO_ENABLED` | no | `true` shows the "Try the demo" button (the backend needs `DEMO_ENABLED=true`) |

See the [root README](../README.md) for the full project description.
