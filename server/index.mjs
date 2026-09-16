import pg from 'pg';import {readConfig} from './config.mjs';import {migrate} from './migrate.mjs';import {createApp} from './app.mjs';
const config=readConfig();const pool=new pg.Pool({connectionString:config.databaseUrl,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
pool.on('error',error=>console.error('Database connection error:',error.code??error.name));
await migrate(pool);const app=createApp({pool,config});app.listen(config.port,config.host,()=>console.log(`Maxel is running at ${config.origin}\nStudio inbox: ${config.origin}/admin/`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{app.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();});
