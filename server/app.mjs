import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {validateInquiry} from './validation.mjs';
const dist=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const adminRoot=resolve(fileURLToPath(new URL('../src/admin/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const hash=s=>createHash('sha256').update(s).digest('hex');
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function createApp({pool,config}){
  const passwordHash=scryptSync(config.password,config.secret,64);const attempts=new Map();
  const cookieName='maxel_session';
  const cookie=(token,age)=>`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${config.cookieSecure?'; Secure':''}`;
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const ipKey=req=>createHmac('sha256',config.secret).update(req.socket.remoteAddress??'unknown').digest('hex');
  async function body(req){if(!req.headers['content-type']?.includes('application/json'))throw Object.assign(new Error('Send JSON data.'),{status:415});let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>18000)throw Object.assign(new Error('Your message is too long.'),{status:413});}try{return JSON.parse(raw);}catch{throw Object.assign(new Error('Invalid form data.'),{status:400});}}
  async function session(req){const token=(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const r=await pool.query('SELECT token_hash FROM admin_sessions WHERE token_hash=$1 AND expires_at > NOW()',[hash(token)]);return r.rows[0]?.token_hash??null;}
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    try{
      const url=new URL(req.url,config.origin);const path=url.pathname;const method=req.method;
      if(path.startsWith('/api/')){
        if(['POST','PATCH','DELETE'].includes(method)&&req.headers.origin!==config.origin)return json(res,403,{error:'This request did not come from the website.'});
        if(path==='/api/health'&&method==='GET'){await pool.query('SELECT 1');return json(res,200,{ok:true});}
        if(path==='/api/admin/session'&&method==='GET')return json(res,200,{authenticated:!!await session(req)});
        if(path==='/api/admin/login'&&method==='POST'){
          const key=ipKey(req);const now=Date.now();let state=attempts.get(key);if(!state||state.until<now){state={count:0,until:now+900000};attempts.set(key,state);}if(state.count>=5)return json(res,429,{error:'Too many attempts. Try again in 15 minutes.'});
          if(attempts.size>1000){for(const[k,v]of attempts){if(v.until<now)attempts.delete(k);}if(attempts.size>1000)return json(res,429,{error:'Please try again later.'});}
          const input=await body(req);state.count++;
          const valid=typeof input?.password==='string'&&input.password.length<=512&&timingSafeEqual(scryptSync(input.password,config.secret,64),passwordHash);
          if(!valid)return json(res,401,{error:'Incorrect password.'});
          attempts.delete(key);const token=randomBytes(32).toString('hex');await pool.query('DELETE FROM admin_sessions WHERE expires_at <= NOW()');await pool.query("INSERT INTO admin_sessions (token_hash,expires_at) VALUES ($1,NOW()+INTERVAL '8 hours')",[hash(token)]);res.setHeader('Set-Cookie',cookie(token,28800));return json(res,200,{ok:true});
        }
        if(path==='/api/admin/logout'&&method==='POST'){const tokenHash=await session(req);if(tokenHash)await pool.query('DELETE FROM admin_sessions WHERE token_hash=$1',[tokenHash]);res.setHeader('Set-Cookie',cookie('',0));return json(res,200,{ok:true});}
        if(path==='/api/inquiries'&&method==='POST'){
          const valid=validateInquiry(await body(req));if(valid.error)return json(res,400,{error:valid.error});const v=valid.data;const client=await pool.connect();
          try{await client.query('BEGIN');const ip=ipKey(req);await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[ip]);await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[v.email]);
            const prior=await client.query('SELECT id FROM inquiries WHERE id=$1',[v.id]);if(prior.rows.length){await client.query('COMMIT');return json(res,200,{ok:true,reference:v.id.slice(0,8).toUpperCase()});}
            const rate=await client.query("SELECT count(*) FILTER (WHERE email=$1)::int AS email_count, count(*) FILTER (WHERE ip_hash=$2)::int AS ip_count FROM inquiries WHERE created_at>NOW()-INTERVAL '1 hour' AND (email=$1 OR ip_hash=$2)",[v.email,ip]);
            if(rate.rows[0].email_count>=3||rate.rows[0].ip_count>=15){await client.query('ROLLBACK');return json(res,429,{error:'Please wait before sending another inquiry.'});}
            await client.query('INSERT INTO inquiries (id,name,email,company,service,budget,timeline,message,consent,ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9) ON CONFLICT (id) DO NOTHING',[v.id,v.name,v.email,v.company,v.service,v.budget,v.timeline,v.message,ip]);await client.query('COMMIT');return json(res,201,{ok:true,reference:v.id.slice(0,8).toUpperCase()});
          }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
        }
        if(path.startsWith('/api/admin/')){
          if(!await session(req))return json(res,401,{error:'Please sign in to the studio.'});
          if(path==='/api/admin/inquiries'&&method==='GET'){
            const state=url.searchParams.get('status')??'all';if(!['all','new','contacted','archived'].includes(state))return json(res,400,{error:'Invalid status.'});
            const query=(url.searchParams.get('q')??'').slice(0,150);const offset=Math.max(0,Math.min(100000,Math.trunc(Number(url.searchParams.get('offset'))||0)));
            const result=await pool.query("SELECT id,name,email,company,service,budget,timeline,message,status,created_at,updated_at FROM inquiries WHERE ($1='all' OR status=$1) AND ($2='' OR name ILIKE '%'||$2||'%' OR email ILIKE '%'||$2||'%' OR company ILIKE '%'||$2||'%' OR message ILIKE '%'||$2||'%') ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $3",[state,query,offset]);
            return json(res,200,{items:result.rows.slice(0,50),hasMore:result.rows.length>50});
          }
          const match=path.match(/^\/api\/admin\/inquiries\/([^/]+)$/);
          if(match&&method==='PATCH'){
            if(!uuid.test(match[1]))return json(res,400,{error:'Invalid inquiry.'});const input=await body(req);if(!['new','contacted','archived'].includes(input?.status))return json(res,400,{error:'Invalid status.'});
            const result=await pool.query('UPDATE inquiries SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id',[input.status,match[1]]);return json(res,result.rowCount?200:404,result.rowCount?{ok:true}:{error:'Inquiry not found.'});
          }
        }
        return json(res,404,{error:'Not found.'});
      }
      if(!['GET','HEAD'].includes(method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
      let file;
      if(path==='/admin'||path==='/admin/'){file=join(adminRoot,'index.html');res.setHeader('Cache-Control','no-store');}
      else if(path==='/admin/admin.js'){file=join(adminRoot,'admin.js');res.setHeader('Cache-Control','no-store');}
      else{file=resolve(dist,'.'+decodeURIComponent(path));if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403);res.end();return;}let info;try{info=await stat(file);}catch{}if(info?.isDirectory()){if(!path.endsWith('/')){res.writeHead(308,{Location:path+'/'+url.search});res.end();return;}file=join(file,'index.html');}}
      let data,status=200;try{data=await readFile(file);}catch{status=404;file=join(dist,'404.html');data=await readFile(file);}
      res.writeHead(status,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(method==='HEAD'?undefined:data);
    }catch(error){if(error.status)return json(res,error.status,{error:error.message});console.error('Request failed:',error.code??error.name);return json(res,503,{error:'The service is temporarily unavailable. Please try again. Your form has not been cleared.'});}
  });
}
