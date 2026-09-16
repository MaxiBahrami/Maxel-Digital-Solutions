# Maxel Digital Solutions

The Maxel website as an independent project, with two modes:

| Mode | Website | Contact | Storage |
| --- | --- | --- | --- |
| Static | HTML, CSS and browser JavaScript | Prepare, copy or download a brief | None |
| Full application | The same design, served by Node.js | Submit inquiries; private studio inbox | PostgreSQL |

**No ChatGPT sign-in, Sites hosting, SQLite or Cloudflare D1 is required.** The backend uses PostgreSQL and parameterized SQL through `pg`.

## Test the complete website on your Mac

Install and start Docker Desktop first. Then open Terminal:

```sh
git clone https://github.com/MaxiBahrami/Maxel-Digital-Solutions.git
cd Maxel-Digital-Solutions
bash scripts/dev-up.sh
```

If you already cloned the repository, enter that folder and run `git pull` instead of cloning again.

Open:

- Website: **http://localhost:8080**
- Studio inbox: **http://localhost:8080/admin/**

The first start builds the application and starts PostgreSQL. It generates unique passwords in your local `.env` file and prints the new studio password in your own terminal. On later starts, find it under `ADMIN_PASSWORD` in `.env`. Do not publish or share that file.

Use the contact page to send a test inquiry, then sign into the studio to see it. You can search, filter, paginate, change status and open an email reply. No automatic confirmation or notification emails are sent.

### Stop and restart

```sh
bash scripts/dev-down.sh
bash scripts/dev-up.sh
```

The PostgreSQL Docker volume preserves inquiries across stops and restarts. **Do not run `docker compose down -v` unless you intend to erase the database.**

The development setup binds the website to your computer’s loopback address only. The PostgreSQL port is not exposed to your network. If port 8080 is already occupied, stop the conflicting application or update both the Compose port mapping and `APP_ORIGIN` consistently.

### See logs

```sh
docker compose logs --tail=100 web
docker compose logs --tail=100 db
```

## What happened to the previous database?

The previous hosted database was inspected on **2026-09-16**. Both `inquiries` and `studio_owner` contained **zero rows**, so there were no records to transfer.

This repository includes the application code, PostgreSQL schema and versioned SQL migrations. GitHub does not host a running database. Real inquiries live in your local PostgreSQL volume, or in a database you configure on your hosting provider. Passwords, sessions and customer records are deliberately excluded from GitHub.

See [db/README.md](db/README.md) for schema and backup details.

## Run without Docker

Requirements: Node.js **22.9+** and a running PostgreSQL database. Docker is not required if you manage PostgreSQL separately.

```sh
npm ci
npm run build:server
```

Create a private `.env` based on `.env.example`. Supply a real `DATABASE_URL`, strong `ADMIN_PASSWORD`, random `SESSION_SECRET`, and the exact `APP_ORIGIN` you will open. Replace every `REPLACE_` placeholder. The server rejects placeholder admin credentials.

```sh
npm start
```

Migrations run on startup before the website accepts connections. The supplied database account needs permission to create tables and indexes in that database. The first migration creates inquiries and hashed admin sessions; later applied migrations are protected by checksums.

The default native server binds to `127.0.0.1:8080`. For a hosted container, use `HOST=0.0.0.0` and your real `APP_ORIGIN`. Public production origins must use HTTPS. Put HTTPS termination at your hosting platform or reverse proxy; this Node server does not issue TLS certificates. Cookies use `Secure` automatically with an HTTPS origin.

The server deliberately does not trust client-supplied proxy IP headers. Behind a reverse proxy, inquiry IP rate limits may group visitors together until trusted-proxy support is configured for that environment.

## Keep or publish the static version

```sh
npm run dev
```

This builds static files and serves them at **http://localhost:4173**. It does not start PostgreSQL or the API.

```sh
npm run build
```

Upload the contents of `dist/` to a static host. The static build has no inbox or login link, and its contact helper clearly states that nothing is sent or saved. Configure a public `contactEmail` in `site.config.mjs` to optionally open an email draft. The user must send that email themselves.

For a GitHub Pages project path:

```sh
BASE_PATH=/Maxel-Digital-Solutions/ npm run build
BASE_PATH=/Maxel-Digital-Solutions/ npm run preview
```

The full PostgreSQL application must run at a domain root; it cannot be deployed to GitHub Pages. Uploading the source repository does not automatically enable hosting.

## Domain and metadata

Set `siteUrl` in `site.config.mjs`, or use `SITE_URL=https://www.example.com` during a build. This generates canonical URLs, a sitemap and robots.txt. Leave it empty until you have your actual domain. Domain/DNS configuration and hosting are separate from the GitHub upload.

## Project structure

```text
src/pages/             Editable HTML content, including both contact modes
src/styles.css         Responsive shared design
src/main.js            Static navigation and local brief helper
src/contact-server.js  PostgreSQL contact form client
src/admin/             Independent studio login and inbox UI
src/assets/            Original artwork and favicon
site.config.mjs        Public name, domain and contact settings
server/                Node.js HTTP API, authorization and static serving
db/migrations/         PostgreSQL SQL migrations
scripts/dev-up.sh      Start the complete local application
scripts/dev-down.sh    Stop it while keeping database data
scripts/build.mjs      Static builder
scripts/build-server.mjs  Builder with live contact and studio links
tests/                 Static, PostgreSQL and HTTP flow tests
compose.yaml           Node application + PostgreSQL 17
Dockerfile             Application image
.env.example           Placeholder configuration, never real credentials
```

The hero asset is losslessly stored as base64 source and decoded into a normal local WebP by the builder. The browser does not load the base64 source. Page navigation and FAQ disclosures work without JavaScript; form helpers and the studio UI require JavaScript.

## Verification

```sh
npm ci
npm test
```

Tests cover static routes/assets, contact validation, SQL persistence, duplicate retries, submission rate limits, admin login/logout, hashed sessions, access control, parameterized search, status updates, and migration idempotency.

Database integration tests use **PGlite**, the PostgreSQL engine compiled to WebAssembly. This is not SQLite and is used only in tests. The production application uses a normal PostgreSQL service through `pg.Pool`.

The Docker stack has not been launched in the build environment because Docker is unavailable there. Run `bash scripts/dev-up.sh` on your Mac to verify the complete Docker Desktop setup. The Node HTTP API and PostgreSQL query behavior are covered by the integration tests.

## Private data and credentials

- `.env`, backups and dumps stay outside Git.
- Inquiries remain in PostgreSQL; the application does not export them to the repository.
- Session cookies are HTTP-only and SameSite=Strict; database session tokens are hashed.
- Changing the admin password does not invalidate sessions already issued. To revoke all current sessions, run `DELETE FROM admin_sessions;` as the database administrator, then restart the application with the new password.
- Back up the database before destructive database or volume operations.
