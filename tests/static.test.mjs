import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
const base=process.env.BASE_PATH??'/';
const dist=resolve('dist');
const routes=JSON.parse(await readFile('src/pages.json','utf8'));
test('every public route is a complete static document with working internal links and assets',async()=>{
 for(const page of routes){
  const file=join(dist,page.path,'index.html');const html=await readFile(file,'utf8');
  assert.match(html,/<!doctype html>/i);assert.match(html,/<title>[^<]+<\/title>/);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,page.path);
  assert.doesNotMatch(html,/_next\/|cloudflare:|signin-with-chatgpt|\/api\/|Studio login|<template|__vite|data-rsc|\{\{/i,page.path);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs on '+page.path);
  for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   const link=m[1];if(link.startsWith('https:')||link.startsWith('http:')||link.startsWith('mailto:'))continue;
   if(link.startsWith('#')){assert.ok(ids.includes(link.slice(1)),page.path+': '+link);continue;}
   assert.ok(link.startsWith(base),page.path+': wrong base '+link);
   let target=join(dist,link.slice(base.length).split(/[?#]/)[0]);const info=await stat(target);if(info.isDirectory())target=join(target,'index.html');assert.ok((await stat(target)).isFile(),target);
  }
 }
});
test('static contact does not claim to send or store inquiries',async()=>{
 const html=await readFile(join(dist,'contact/index.html'),'utf8');assert.match(html,/Nothing is submitted or stored on a server/);assert.match(html,/It has not been sent/);assert.doesNotMatch(html,/INQUIRY SAVED|in Maxel’s inbox|form-success/);
 const js=await readFile(join(dist,'assets/main.js'),'utf8');assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);assert.match(js,/navigator\.clipboard/);assert.match(js,/Blob\(/);
});
test('the hero asset is a real, locally hosted WebP',async()=>{
 const bytes=await readFile(join(dist,'assets/maxel-sculpture.webp'));assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.ok(bytes.length>10000);
});
test('output has no authentication, server or source-asset files',async()=>{
 const files=await readdir(dist,{recursive:true});assert.ok(files.includes('404.html'));assert.ok(files.includes('.nojekyll'));assert.ok(!files.some(f=>/\.base64$|^admin(?:\/|$)|^api(?:\/|$)|\.env|\.tsx$/.test(f)));
});

test('home and services use the scroll-driven service system',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 const services=await readFile(join(dist,'services/index.html'),'utf8');
 for(const [name,html] of [['home',home],['services',services]]){
  assert.match(html,/data-service-system/,name);
  assert.match(html,/data-state="strategy"/,name);
  assert.match(html,/data-state="websites"/,name);
  assert.match(html,/data-state="products"/,name);
  assert.match(html,/data-state="improvements"/,name);
  assert.doesNotMatch(html,/services-showcase/,name);
 }
});

test('built site includes the unified Maxel typography system',async()=>{
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/--mx-font-sans:-apple-system,BlinkMacSystemFont/);
 assert.match(css,/MAXEL TYPOGRAPHY SYSTEM V13/);
});

test('homepage uses the interactive connected process rail',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/data-process-rail/);
 assert.match(home,/From direction<br>to delivery\./);
 assert.match(home,/data-process-step="0"/);
 assert.match(home,/data-process-step="3"/);
 assert.match(home,/data-process-prev/);
 assert.match(home,/data-process-next/);
 assert.doesNotMatch(home,/How projects move forward\./);
});

test('process rail uses the clearer v2 micro-visuals',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.equal((home.match(/mx-pr__visual-v2/g)||[]).length,4);
 assert.match(home,/GOAL/);
 assert.match(home,/PRIORITY/);
 assert.match(home,/INTERFACE/);
 assert.match(home,/BEFORE/);
 assert.match(home,/AFTER/);
});

test('services sticky visual is not trapped by section overflow',async()=>{
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/\.mx-ss\{\s*position:relative;\s*overflow:visible;/);
 assert.match(css,/\.mx-ss__intro\{\s*overflow:clip;/);
});

test('homepage hero uses the interactive Maxel system lab',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/data-system-hero/);
 assert.match(home,/MAXEL\.SYSTEM \/ LIVE MODEL/);
 assert.match(home,/data-hero-state="strategy"/);
 assert.match(home,/data-hero-state="experience"/);
 assert.match(home,/data-hero-state="technology"/);
 assert.match(home,/data-hero-tab="production"/);
 assert.match(home,/data-hero-terminal/);
 assert.doesNotMatch(home,/hero-image-card/);
 assert.doesNotMatch(home,/hero-proof/);
});

test('homepage master direction connects work studio launch and motion systems',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/<body class="home-page">/);
 assert.match(home,/data-work-showcase/);
 assert.match(home,/data-work-tab="student"/);
 assert.match(home,/data-work-tab="teacher"/);
 assert.match(home,/data-work-tab="admin"/);
 assert.match(home,/class="mx-studio motion-section"/);
 assert.match(home,/class="mx-launch motion-section"/);
 assert.match(home,/Bring the problem\.<br>We’ll define the system\./);
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/MAXEL HOMEPAGE MASTER DIRECTION V18/);
 assert.match(css,/--mx-page-progress/);
});

test('hero narrative explains the complete Maxel system journey',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/mx-hero--v19/);
 assert.match(home,/BUSINESS NEED/);
 assert.match(home,/WORKING SYSTEM/);
 assert.match(home,/01[\s\S]*Understand/);
 assert.match(home,/02[\s\S]*Shape/);
 assert.match(home,/03[\s\S]*Connect/);
 assert.match(home,/04[\s\S]*Ship/);
 assert.match(home,/data-hero-message/);
 assert.match(home,/data-hero-narrative/);
 assert.match(home,/data-hero-telemetry|mx-lab__telemetry/);
});

test('selected work uses a scrollable project selector before opening EDUFY',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/data-work-selector/);
 assert.match(home,/data-work-selector-viewport/);
 assert.match(home,/data-project-select="edufy"/);
 assert.match(home,/aria-controls="edufy-case-detail"/);
 assert.match(home,/data-work-project-panel="edufy"/);
 assert.match(home,/Choose a case\./);
 assert.match(home,/02 \/ CASE[\s\S]*RESERVED/);
 assert.match(home,/03 \/ CASE[\s\S]*RESERVED/);
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/SELECTED WORK PROJECT RAIL V20/);
 assert.match(css,/scroll-snap-type:x mandatory/);
});

test('EDUFY case context is integrated into the product window and revealed on demand',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.match(home,/data-edufy-about/);
 assert.match(home,/data-edufy-about-toggle/);
 assert.match(home,/aria-controls="edufy-about-panel"/);
 assert.match(home,/id="edufy-about-panel"/);
 assert.match(home,/About this project/);
 assert.match(home,/One product\.<br>Three user realities\./);
 assert.match(home,/Explore the full case/);
 assert.doesNotMatch(home,/<aside class="mx-work2__copy">/);
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/EDUFY UNIFIED PROJECT DETAILS V22/);
 assert.match(css,/\.mx-work2__about\.is-about-enhanced \.mx-work2__aboutReveal/);
});

test('EDUFY mobile preview avoids duplicate intro and keeps summary on demand',async()=>{
 const home=await readFile(join(dist,'index.html'),'utf8');
 assert.doesNotMatch(home,/class="mx-work2__selectedTitle"/);
 assert.match(home,/PROJECT CONTEXT · EDUFY/);
 assert.match(home,/class="mx-work2__aboutSummary"/);
 assert.match(home,/Education platform in active development across student, teacher and administration experiences\./);
 const css=await readFile(join(dist,'assets/styles.css'),'utf8');
 assert.match(css,/EDUFY MOBILE PRODUCT CARD V23/);
 assert.match(css,/\.mx-work2__side\{\s*display:none;/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
