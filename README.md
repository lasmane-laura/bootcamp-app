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

Render's CLI/Blueprint deploy needs to clone your code from GitHub (or GitLab/Bitbucket) — it can't reach this repo's original private remote (`code.tdlbox.com`). Create a public repo on GitHub and push this code there first:

```bash
brew install gh && gh auth login --web && gh repo create bootcamp-app --public --source=. --remote=github --push
```

**Important — connect GitHub properly, or auto-deploy will silently never fire.** If you see `It looks like we don't have access to your repo, but we'll try to clone it anyway` in a build log, Render cloned the repo as a plain public URL without actually installing its GitHub App — the deploy still succeeds, `autoDeploy` will still show as `"yes"` in the service config, but **no webhook gets registered, so every future push does nothing** (this bit us for over a week of commits before we noticed). Fix it once, in the browser:

1. Go to https://dashboard.render.com/u/settings#account-security → **Git Deployment Credentials** → **Add credential** → **GitHub**, and authorize access to this repo (or all repos).
2. Open the service's own **Settings** tab and confirm/reconnect its repo link — a service created before the connection existed doesn't always pick it up automatically.
3. Verify it actually worked at https://github.com/settings/installations — **Render** should be listed there with access to this repo. (Checking `gh api repos/<owner>/<repo>/hooks` is *not* a valid test — GitHub Apps don't register classic per-repo webhooks, so that endpoint returns `[]` even when the connection is correct.)
4. If the live service was already stuck on an old commit, catch it up once with `render deploys create <service-id> --wait` — every push after that should auto-deploy on its own.

### The command to finish the deploy

Install the Render CLI (now in Homebrew core — no tap needed), log in, and create the service:

```bash
brew install render && render login && render workspace set && render services create --name qa-command-center --type web_service --runtime node --repo https://github.com/<your-username>/bootcamp-app --branch main --plan free --region oregon --build-command "npm install --include=dev && npm run build" --start-command "npm start" --env-var "NODE_ENV=production"
```

- `login` opens your browser to sign in (or create a free account) — do that part when prompted.
- `workspace set` picks the Render account/workspace to deploy into (shows a picker if you belong to more than one).
- `services create` then provisions and builds the service. `--include=dev` on the build command matters: Render sets `NODE_ENV=production` during the build too, and npm skips `devDependencies` (which is where `vite` lives) under that env var by default — without this flag the build fails with `vite: not found`.
- Check build/deploy progress with `render deploys list <service-id>` (the service ID is printed by `services create`, e.g. `srv-xxxxxxxx`).
- Once live, your app is at `https://qa-command-center.onrender.com` (Render appends a random suffix instead if that exact name is already taken by someone else — check the Render dashboard or `render services -o json` if the plain URL 404s).
- If you want the Discord alert feature, add `DISCORD_WEBHOOK_URL` as a secret env var in the service's dashboard afterward (it's deliberately left out of the command above so the real webhook URL never ends up in your shell history).

Paste that final `https://...onrender.com` URL back here when it's done.
