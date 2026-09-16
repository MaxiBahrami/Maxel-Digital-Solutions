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
