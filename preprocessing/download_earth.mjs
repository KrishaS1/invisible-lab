// Fetch the exact published sample files used by the bundled Earth Lab.
// Usage: node --use-system-ca preprocessing/download_earth.mjs [output-directory]
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const destination=process.argv[2] ?? 'data/raw/earth';
const manifest=JSON.parse(fs.readFileSync('public/data/earth/stead-examples.json','utf8')).source;
fs.mkdirSync(destination,{recursive:true});
for(const [name,meta] of Object.entries(manifest.files)){
 const response=await fetch(meta.url);
 if(!response.ok)throw Error(`${response.status}: ${meta.url}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!==meta.sha256)throw Error(`Checksum mismatch for ${name}`);
 fs.writeFileSync(path.join(destination,name),bytes);
 console.log(`Verified ${name}`);
}
fs.writeFileSync(path.join(destination,'seismic-source.json'),JSON.stringify(manifest,null,2));
