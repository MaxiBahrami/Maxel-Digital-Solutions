import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';
import {migrate} from '../server/migrate.mjs';
import {createApp} from '../server/app.mjs';
import {readConfig} from '../server/config.mjs';

test('PostgreSQL schema and HTTP contact/admin workflow',async()=>{
  // PGlite runs the PostgreSQL engine in WASM. Production uses pg.Pool + PostgreSQL 17.
  const db=new PGlite();
  const pool={async query(sql,values){if(!values&&sql.includes(';')){const results=await db.exec(sql);const r=results.at(-1);return {rows:r?.rows??[],rowCount:r?.affectedRows??0};}const r=await db.query(sql,values);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length};},async connect(){return {...pool,release(){}};}};
  const config=readConfig({DATABASE_URL:'postgres://test',ADMIN_PASSWORD:'local-test-password-12345',SESSION_SECRET:'local-test-secret-1234567890123456789',APP_ORIGIN:'http://127.0.0.1:8080'});
  await migrate(pool);await migrate(pool);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,2);
  const app=createApp({pool,config});await new Promise(r=>app.listen(0,'127.0.0.1',r));config.origin='http://127.0.0.1:'+app.address().port;
  const send=(path,{method='GET',body,cookie,origin=config.origin}={})=>fetch(config.origin+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const inquiry=()=>({id:randomUUID(),name:'Test Person',email:'test@example.test',company:'Example',service:'websites',budget:'Not decided yet',timeline:'Flexible / exploring',message:'A PostgreSQL-backed project inquiry for testing.',consent:true,website:''});
  try{
    assert.equal((await send('/api/health')).status,200);
    assert.equal((await send('/api/admin/inquiries')).status,401);
    let p=inquiry();
    assert.equal((await send('/api/inquiries',{method:'POST',body:{...inquiry(),id:randomUUID(),service:'digital-strategy'}})).status,201);
    await pool.query("DELETE FROM inquiries WHERE service='digital-strategy'");
    assert.equal((await send('/api/inquiries',{method:'POST',body:p,origin:'https://untrusted.test'})).status,403);
    assert.equal((await send('/api/inquiries',{method:'POST',body:{...p,consent:false}})).status,400);
    assert.equal((await send('/api/inquiries',{method:'POST',body:{...p,email:'invalid'}})).status,400);
    assert.equal((await send('/api/inquiries',{method:'POST',body:{...p,message:'short'}})).status,400);
    assert.equal((await send('/api/inquiries',{method:'POST',body:p})).status,201);
    assert.equal((await send('/api/inquiries',{method:'POST',body:p})).status,200);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM inquiries')).rows[0].n,1);
    assert.equal((await send('/api/inquiries',{method:'POST',body:inquiry()})).status,201);
    assert.equal((await send('/api/inquiries',{method:'POST',body:inquiry()})).status,201);
    assert.equal((await send('/api/inquiries',{method:'POST',body:inquiry()})).status,429);
    assert.equal((await send('/api/admin/login',{method:'POST',body:{password:'wrong'}})).status,401);
    const login=await send('/api/admin/login',{method:'POST',body:{password:config.password}});assert.equal(login.status,200);
    assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
    const cookie=login.headers.get('set-cookie').split(';')[0];const token=cookie.split('=')[1];
    assert.notEqual((await pool.query('SELECT token_hash FROM admin_sessions')).rows[0].token_hash,token);
    const list=await send('/api/admin/inquiries',{cookie});assert.equal(list.status,200);assert.equal((await list.json()).items.length,3);
    const injection=await send('/api/admin/inquiries?q='+encodeURIComponent("'; DROP TABLE inquiries; --"),{cookie});assert.equal(injection.status,200);assert.equal((await injection.json()).items.length,0);
    assert.equal((await send('/api/admin/inquiries/'+p.id,{method:'PATCH',body:{status:'contacted'}})).status,401);
    assert.equal((await send('/api/admin/inquiries/'+p.id,{method:'PATCH',cookie,body:{status:'invalid'}})).status,400);
    assert.equal((await send('/api/admin/inquiries/'+p.id,{method:'PATCH',cookie,body:{status:'contacted'}})).status,200);
    assert.equal((await pool.query('SELECT status FROM inquiries WHERE id=$1',[p.id])).rows[0].status,'contacted');
    const filtered=await send('/api/admin/inquiries?status=contacted',{cookie});assert.equal((await filtered.json()).items.length,1);
    await send('/api/admin/logout',{method:'POST',cookie,body:{}});assert.equal((await send('/api/admin/inquiries',{cookie})).status,401);
    for(let i=0;i<5;i++)assert.equal((await send('/api/admin/login',{method:'POST',body:{password:'wrong'}})).status,401);
    assert.equal((await send('/api/admin/login',{method:'POST',body:{password:'wrong'}})).status,429);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM inquiries')).rows[0].n,3);
  }finally{await new Promise(r=>app.close(r));await db.close();}
});

test('static and server contact scripts can share a document without global collisions',async()=>{
  const {readFile}=await import('node:fs/promises');const {createContext,Script}=await import('node:vm');
  const context=createContext({document:{querySelector:()=>null,getElementById:()=>null}});
  new Script(await readFile('src/main.js','utf8')).runInContext(context);
  new Script(await readFile('src/contact-server.js','utf8')).runInContext(context);
});
