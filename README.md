# QA Command Center

A QA test-management app: test cases, suites, bugs, test runs, reports, a dashboard, and settings.

React (Vite) client + Express server, npm workspaces monorepo (`client/`, `server/`), with a `better-sqlite3` database file for storage.

## Local development

```bash
npm install
npm run dev
```

This runs the Express API (port 5000) and the Vite dev server (port 5173, proxying `/api` to Express) side by side.

## Environment variables

Copy `.env.example` to `.env` at the repo root and fill in real values:

- `DISCORD_WEBHOOK_URL` — optional. Posts an alert to this webhook on bug status changes and comments. Leave blank to disable.
- `PORT` — optional, defaults to `5000`. Most hosts (including Render) set this automatically.

## Production build

```bash
npm run build   # builds the client to client/dist
npm start       # serves the API and the built client from one process
```

In production, Express serves the built React app directly (`client/dist`) alongside the `/api/*` routes, so the whole app runs as a single process on one port — no CORS, no separate frontend host.

## Deploy

This app is deployed to **[Render](https://render.com)** as a single free "Web Service." Render was chosen over Vercel/Netlify/Cloudflare Pages because those are built around serverless functions with an ephemeral, per-invocation filesystem — a poor fit for this app's `better-sqlite3` file-based database. Render's free web service runs one long-lived Node process instead, so the SQLite file persists normally across requests while the service is up.

**Free tier, verified at time of writing:** Render's free Web Service plan includes 750 instance-hours/month (enough to run one service continuously), and supports a custom Node runtime, build command, start command, and env vars at no cost. No credit card is required for the free plan. ([Render free tier docs](https://render.com/docs/free))

**Known limitation of the free tier:** free web services have no persistent disk — the filesystem (including `server/data.sqlite` and any files in `server/uploads/`) resets whenever the service redeploys *or* spins down from 15 minutes of inactivity. The app re-seeds its sample data automatically on every boot (see `server/index.js`), so it always comes back up in a working, demo-ready state — just without any data changes made since the last spin-down. If you need real persistence later, either upgrade to a paid Render plan with a persistent disk, or swap `better-sqlite3` for Render's free Postgres.

### Config files added for this

- **`render.yaml`** — a Render "Blueprint": declares the web service, build/start commands, and env vars as code. Lets you deploy via the Render dashboard's *New → Blueprint* option (point it at this repo) instead of the CLI, if you'd rather click through the browser.
- **`.node-version`** / the root `package.json` `engines` field — pin Node 22, since `better-sqlite3` needs to compile its native addon against a specific Node version.
- **`.env.example`** — documents the env vars above.
- `server/index.js` now also serves `client/dist` with an SPA fallback (see "Production build" above).

### One-time prerequisite: push this repo to GitHub

Render's CLI/Blueprint deploy needs to clone your code from GitHub (or GitLab/Bitbucket) — it can't reach this repo's current private remote (`code.tdlbox.com`). Create a new repo on GitHub and push this code there first:

```bash
git remote add github https://github.com/<your-username>/<repo-name>.git
git push github main
```

(If Render says it can't access the repo when you run the command below, connect your GitHub account once at https://dashboard.render.com/settings#git, then re-run it.)

### The command to finish the deploy

Run this in your own terminal, from the repo root, after pushing to GitHub:

```bash
brew install render-oss/render/render && render login && render services create --name qa-command-center --type web --runtime node --repo https://github.com/<your-username>/<repo-name> --branch main --plan free --region oregon --build-command "npm install && npm run build" --start-command "npm start" --env-var "NODE_ENV=production"
```

(The `brew install` step installs the official Render CLI — one-time, skip it if you already have `render` on your PATH.)

- `login` opens your browser to sign in (or create a free account) — do that part when prompted.
- `services create` then provisions and deploys the service non-interactively.
- Once it finishes, your app is live at `https://qa-command-center.onrender.com` (Render appends a random suffix instead if that exact name is already taken by someone else — the real URL is printed in the command's output and in the Render dashboard).
- If you want the Discord alert feature, add `DISCORD_WEBHOOK_URL` as a secret env var in the service's dashboard afterward (it's deliberately left out of the command above so the real webhook URL never ends up in your shell history).

Paste that final `https://...onrender.com` URL back here when it's done.
