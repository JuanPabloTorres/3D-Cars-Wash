import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {randomBytes} from 'node:crypto'
import {request as httpRequest} from 'node:http'
const dir=await mkdtemp(join(tmpdir(),'cw-standalone-')),base='http://127.0.0.1:4186'
const child=spawn(process.execPath,['dist-server/start.mjs'],{env:{...process.env,PORT:'4186',CARWASH_DB_PATH:join(dir,'db.sqlite'),CARWASH_ADMIN_TOKEN:randomBytes(24).toString('hex')},stdio:['ignore','ignore','pipe'],windowsHide:true})
let error='';child.stderr.on('data',s=>error+=s)
try{
 let ready=false
 for(let i=0;i<50;i++){try{ready=(await fetch(base+'/healthz')).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100))}
 assert(ready,error)
 assert.match(await(await fetch(base+'/admin')).text(),/id="root"/)
 assert.equal((await fetch(base+'/missing-file.png')).status,404)
 const res=await fetch(base+'/api/demo/session'),cookie=res.headers.get('set-cookie').split(';')[0],session=await res.json()
 assert.match(res.headers.get('set-cookie'),/HttpOnly/)
 const post=(path,data,headers={})=>fetch(base+'/api/demo/'+path,{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json','X-Demo-Nonce':session.nonce,...headers},body:JSON.stringify(data)})
 assert.equal((await post('profile',{name:'Forged'},{Origin:'http://attacker.example'})).status,403)
 assert.equal((await post('profile',{name:'Forged'},{'X-Demo-Nonce':'wrong'})).status,403)
 assert.equal((await post('admin/users',{username:'bad',role:'admin'})).status,403)
 // Fetch controls Host itself; raw HTTP is needed to exercise a forged Host.
 const rejectedHost=await new Promise((done,reject)=>{const req=httpRequest(base+'/api/demo/catalog',{headers:{Host:'attacker.example'}},res=>{res.resume();done(res.statusCode)});req.on('error',reject);req.end()})
 assert.equal(rejectedHost,403)
 const registered=await post('auth/register',{username:'customer',name:'Customer',role:'admin',password:randomBytes(18).toString('hex')})
 assert.equal(registered.status,200);const account=await registered.json();assert.equal(account.role,'customer')
 const jwtCookie=registered.headers.get('set-cookie').split(';')[0]
 assert.equal(jwtCookie.slice(jwtCookie.indexOf('=')+1).split('.').length,3)
 assert.equal((await(await fetch(base+'/api/demo/session',{headers:{Cookie:jwtCookie}})).json()).role,'customer')
 assert.equal((await fetch(base+'/api/demo/admin/snapshot',{headers:{Cookie:jwtCookie}})).status,403)
 assert.equal((await post('logout',{}, {Cookie:jwtCookie,'X-Demo-Nonce':account.nonce})).status,200)
 assert.equal((await(await fetch(base+'/api/demo/session',{headers:{Cookie:jwtCookie}})).json()).role,'visitor')
 console.log('Standalone Node server: routes, health, JWT, logout replay, CSRF, Host and role isolation PASS')
}finally{child.kill();await new Promise(r=>child.once('exit',r))}
