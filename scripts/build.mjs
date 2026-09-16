import {readFile,writeFile,mkdir,readdir,rm,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import config from '../site.config.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const out=join(root,'dist');
const rawBase=process.env.BASE_PATH??'/';
if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(rawBase))throw new Error('BASE_PATH must be / or a path like /Maxel-Digital-Solutions/.');
const base=rawBase;
const origin=(process.env.SITE_URL??config.siteUrl).replace(/\/$/,'');
if(origin&&!/^https?:\/\/[^/?#]+$/.test(origin))throw new Error('SITE_URL must be an origin such as https://example.com. Use BASE_PATH for a subdirectory.');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routes=JSON.parse(await readFile(join(root,'src/pages.json'),'utf8'));
const navigation=[['/services/','Services'],['/work/','Work'],['/about/','Studio'],['/contact/','Contact']];
const href=path=>base+path.replace(/^\//,'');
function nav(path,mobile=false){return (mobile?[['/','Home'],...navigation]:navigation).map(([to,label])=>`<a href="${href(to)}"${to==='/'?path==='/'?' aria-current="page"':'':path.startsWith(to)?' aria-current="page"':''}>${label}</a>`).join('');}
function shell(page,content){
 const canonical=origin?origin+href(page.path):'';
 return `<!doctype html>
<html lang="${esc(config.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10110f">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  ${canonical?`<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">`:''}
  <link rel="icon" href="${href('/assets/favicon.svg')}" type="image/svg+xml">
  <link rel="stylesheet" href="${href('/assets/styles.css')}">
  <script src="${href('/assets/main.js')}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="header">
  <a class="brand" href="${base}" aria-label="Maxel Digital Solutions home">maxel<span>digital solutions</span></a>
  <nav class="desktop-nav" aria-label="Main navigation">${nav(page.path)}</nav>
  <a class="nav-contact" href="${href('/contact/')}">Start a project <span aria-hidden="true">↗</span></a>
  <details class="static-menu"><summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">${nav(page.path,true)}</nav></details>
</header>
<main id="main">${content}</main>
<div class="end-wordmark" aria-hidden="true">maxel<span>↗</span></div>
<footer><p>© ${new Date().getFullYear()} ${esc(config.name)}</p><nav aria-label="Footer navigation"><a href="${href('/privacy/')}">Data & privacy</a><a href="${href('/contact/')}">Contact</a><a href="#main">Back to top ↑</a></nav></footer>
</body>
</html>\n`;
}
function rewriteLinks(html){return html.replace(/\b(href|src)="(\/[^" ]*)"/g,(_,attr,url)=>{if(url.startsWith('//'))throw new Error('Protocol-relative assets are not supported');let [path,...query]=url.split('?');if(path==='/maxel-sculpture.webp')path='/assets/maxel-sculpture.webp';if(routes.some(r=>r.path===path+'/'))path+='/';return `${attr}="${href(path)}${query.length?'?'+query.join('?'):''}"`;});}
await rm(out,{recursive:true,force:true});await mkdir(join(out,'assets'),{recursive:true});
for(const file of await readdir(join(root,'src/assets'))){const source=join(root,'src/assets',file);if(file.endsWith('.base64'))await writeFile(join(out,'assets',file.slice(0,-7)),Buffer.from(await readFile(source,'utf8'),'base64'));else await copyFile(source,join(out,'assets',file));}
await copyFile(join(root,'src/styles.css'),join(out,'assets/styles.css'));
await copyFile(join(root,'src/main.js'),join(out,'assets/main.js'));
for(const page of routes){let content=await readFile(join(root,'src/pages',page.source),'utf8');content=content.replaceAll('{{CONTACT_EMAIL}}',esc(config.contactEmail)).replaceAll('{{PERSONAL_WEBSITE}}',esc(config.personalWebsite));const folder=join(out,page.path);await mkdir(folder,{recursive:true});await writeFile(join(folder,'index.html'),shell(page,rewriteLinks(content)));}
const missing={path:'/404.html',title:'Page not found | '+config.name,description:'Return to Maxel Digital Solutions.'};
await writeFile(join(out,'404.html'),shell(missing,`<section class="page-intro"><span class="eyebrow">404 / PAGE NOT FOUND</span><h1>Let’s get you<br>back on track.</h1><p>This page may have moved, or the address may be incorrect.</p><a class="button primary" href="${base}">Back to the homepage <span aria-hidden="true">↗</span></a></section>`));
await writeFile(join(out,'.nojekyll'),'');
if(origin){await writeFile(join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+esc(origin+href(r.path))+'</loc></url>').join('')+'</urlset>\n');await writeFile(join(out,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+href('/sitemap.xml')+'\n');}
console.log(`Built ${routes.length} static pages + 404 into dist (base path: ${base}).`);
