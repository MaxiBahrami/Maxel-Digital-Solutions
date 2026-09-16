# Maxel Digital Solutions

A standalone, fully static company website. The original Maxel design has been converted into editable HTML pages, shared CSS and small browser-side JavaScript.

**No React, ChatGPT, Cloudflare Worker, database, authentication service or runtime server is required.** Node.js is used only to assemble the files before deployment and to preview them locally.

## Requirements

- Node.js 22 or later
- No npm dependencies or API keys

## Run locally

```sh
npm run dev
```

Open `http://localhost:4173`. This builds and serves the website. After editing source files, run `npm run build` in another terminal and refresh the browser. The preview server deliberately binds to localhost.

## Build and verify

```sh
npm test
npm run build
```

Upload the **contents of `dist/`** to any static web host. Only HTML, CSS, browser JavaScript and local images are deployed. Do not upload the source folder instead of the built output.

All routes are actual folders containing `index.html`. Deep links work with ordinary directory-index hosting; no SPA fallback is required. Configure the host to serve `404.html` for unknown addresses if supported.

### Hosting under a subdirectory

For a GitHub Pages project URL, for example:

```sh
BASE_PATH=/Maxel-Digital-Solutions/ npm test
BASE_PATH=/Maxel-Digital-Solutions/ npm run build
BASE_PATH=/Maxel-Digital-Solutions/ npm run preview
```

In PowerShell, set `$env:BASE_PATH = '/Maxel-Digital-Solutions/'` before running the npm commands.

`BASE_PATH` defaults to `/`, which is appropriate for a custom domain or a website hosted at a domain root. It must begin and end with `/`. Use the same value when building and previewing. GitHub Pages still needs to be configured separately in repository settings with a publishing workflow or your chosen deployment pipeline. Uploading this source to GitHub does not itself enable hosting.

### Custom domain and search metadata

Set `siteUrl` in `site.config.mjs` to your domain origin, or set `SITE_URL` at build time:

```sh
SITE_URL=https://www.example.com npm run build
```

This generates canonical URLs, `sitemap.xml` and `robots.txt`. Until a real origin is configured, the build omits these rather than publishing an invented address. Domain registration and DNS configuration happen at your provider.

## Contact behavior

The project brief helper runs entirely in the visitor’s browser:

- Validates the required fields using native browser validation.
- Creates a readable project brief.
- Lets the visitor copy it or download it as a text file.
- Optionally opens a prefilled email draft after `contactEmail` is set in `site.config.mjs`.

**It does not send email or submit, store or save inquiries.** The visitor must send a draft through their own email app. Long drafts fall back to copy/download to avoid mail-URL limits. If clipboard access is unavailable, the text is selected for manual copying. No data is written to browser storage.

`contactEmail` is intentionally blank because a public business email has not been confirmed. The existing link to Maximilian’s personal website remains available. Only set an address you want to publish in the generated HTML.

The former server inbox, owner account, database and `/api` routes are not part of this static project. Data from the hosted application is not exported.

## Editing

```text
site.config.mjs       Public name, domain, contact email and website settings
src/pages.json       Routes, page titles and descriptions
src/pages/*.html     Page content, editable without a framework
src/styles.css       Shared responsive design
src/main.js          Mobile navigation and project brief interactions
src/assets/          Favicon and encoded source artwork
scripts/build.mjs    Dependency-free static builder
scripts/serve.mjs    Local preview server
tests/static.test.mjs  Route, asset and static-behavior checks
```

The hero artwork is stored as `maxel-sculpture.webp.base64` for lossless, text-safe source transport. The builder decodes it to an ordinary local `.webp` file; browsers never load the encoded source. To replace it, base64-encode your WebP into that source file. The favicon is a standard SVG.

To add a page, create its HTML fragment in `src/pages/` and add a route record to `src/pages.json`. Shared navigation and document layout are in `scripts/build.mjs`.

## Included pages

- Home
- Services and three individual service pages
- Selected work and EDUFY case study
- Studio
- Contact / project brief
- Data & privacy
- Custom 404 page

Navigation, FAQ disclosure controls and all page content work without JavaScript. The optional project brief helper needs JavaScript. Images and scripts are served locally; the website does not fetch third-party fonts, analytics or trackers.

## Validation

`npm test` builds the project and verifies all public routes, internal links, local assets, page titles, heading counts and anchor targets. It also checks for accidental server/authentication dependencies and verifies the contact flow does not claim to send messages.

The project has been checked with both `/` and `/Maxel-Digital-Solutions/` base paths. These automated checks are not a visual browser audit.
