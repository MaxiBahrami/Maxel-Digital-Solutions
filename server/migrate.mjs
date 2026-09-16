import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('../db/migrations/',import.meta.url);
export async function migrate(pool){
  const client=await pool.connect();
  try{
    await client.query('SELECT pg_advisory_lock(76385211)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()){
      const sql=await readFile(new URL(name,dir),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
      const applied=await client.query('SELECT checksum FROM schema_migrations WHERE name=$1',[name]);
      if(applied.rows.length){if(applied.rows[0].checksum!==checksum)throw new Error('Applied migration changed: '+name);continue;}
      await client.query('BEGIN');
      try{await client.query(sql);await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)',[name,checksum]);await client.query('COMMIT');}
      catch(error){await client.query('ROLLBACK');throw error;}
    }
  }finally{await client.query('SELECT pg_advisory_unlock(76385211)').catch(()=>{});client.release();}
}
