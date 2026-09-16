export function readConfig(env=process.env){
  const origin=new URL(env.APP_ORIGIN??'http://localhost:8080');
  if(!['http:','https:'].includes(origin.protocol)||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('APP_ORIGIN must be a complete origin, e.g. http://localhost:8080');
  if(!env.DATABASE_URL)throw new Error('DATABASE_URL is required. Run bash scripts/dev-up.sh or configure .env.');
  if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.startsWith('REPLACE_')||env.ADMIN_PASSWORD.length<16)throw new Error('ADMIN_PASSWORD must be at least 16 characters.');
  if(!env.SESSION_SECRET||env.SESSION_SECRET.startsWith('REPLACE_')||env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must be at least 32 characters.');
  if(env.NODE_ENV==='production'&&origin.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(origin.hostname))throw new Error('Use HTTPS for a public production APP_ORIGIN.');
  return {databaseUrl:env.DATABASE_URL,origin:origin.origin,password:env.ADMIN_PASSWORD,secret:env.SESSION_SECRET,cookieSecure:origin.protocol==='https:',port:Number(env.PORT??8080),host:env.HOST??'127.0.0.1'};
}
