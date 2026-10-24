import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
const base=process.env.CARWASH_URL||'http://127.0.0.1:4173'
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error('Local demo only')
const file='.cache/mvp-test-accounts.json'
let stored
try{stored=JSON.parse(await readFile(file,'utf8'))}catch{}
let cookie='',nonce=''
async function request(path,data){
 const res=await fetch(base+'/api/demo/'+path,{method:data?'POST':'GET',headers:{Cookie:cookie,...data?{Origin:base,'Content-Type':'application/json','X-Demo-Nonce':nonce}:{}},body:data?JSON.stringify(data):undefined})
 if(res.headers.has('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0]
 const body=await res.json();if(!res.ok)throw new Error(body.error||'Request failed')
 if(body.nonce)nonce=body.nonce;return body
}
await request('session')
const key=(await readFile(process.env.CARWASH_TOKEN_PATH||'server/.local-admin-token','utf8')).trim()
await request('admin/login',{key})
try{
 const snapshot=await request('admin/snapshot'),accounts=stored?.accounts||[]
 for(const [username,name,role] of [['cliente.mvp','Cliente de prueba','customer'],['empleado.mvp','Empleado de prueba','employee'],['admin.mvp','Administrador de prueba','admin']]){
  const existing=snapshot.users.find(u=>u.username===username),known=stored?.accounts?.find(u=>u.username===username)
  if(existing&&!known)throw new Error('Existing account without local credential record: '+username)
  const account=known||{username,name,role,password:randomBytes(18).toString('base64url')}
  if(!existing)await request('admin/users',account)
  if(!known)accounts.push(account)
  await mkdir('.cache',{recursive:true})
  await writeFile(file,JSON.stringify({base,accounts},null,2),{mode:0o600})
 }
 console.log('Three local test accounts available. Credentials: '+file)
}finally{await request('logout',{})}
