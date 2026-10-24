import {describe,it,expect} from 'vitest'
import {randomBytes} from 'node:crypto'
import {mkdtempSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {SignJWT} from 'jose'
import {SessionTokens,loadSessionKey} from '../../server/sessionTokens'

describe('JWT identity boundary',()=>{
 it('verifies identity across key reload, rejects wrong keys and expired tokens',async()=>{
  const path=join(mkdtempSync(join(tmpdir(),'cw-jwt-')),'test.sqlite'),tokens=new SessionTokens(loadSessionKey(path))
  const expires=Date.now()+60000,token=await tokens.issue('session-id','user-id',expires)
  expect(await new SessionTokens(loadSessionKey(path)).verify(token)).toEqual({sessionId:'session-id',subject:'user-id'})
  expect(await new SessionTokens(randomBytes(32)).verify(token)).toBeNull()
  expect(await tokens.verify(token,new Date(expires+1000))).toBeNull()
  expect(await tokens.verify('malformed')).toBeNull()
  writeFileSync(path+'.jwt-key','invalid')
  expect(()=>loadSessionKey(path)).toThrow('clave JWT local no es válida')
 })
 it('rejects foreign issuer/audience, missing expiration, wrong algorithm and unsigned tokens',async()=>{
  const key=randomBytes(32),tokens=new SessionTokens(key)
  const signed=(issuer:string,audience:string,alg='HS256',expiry=true)=>{
   const jwt=new SignJWT({}).setProtectedHeader({alg,typ:'JWT'}).setSubject('user').setJti('session').setIssuedAt().setIssuer(issuer).setAudience(audience)
   if(expiry)jwt.setExpirationTime('1h')
   return jwt.sign(key)
  }
  for(const token of [await signed('foreign','urn:carwash:api'),await signed('urn:carwash:local','foreign'),await signed('urn:carwash:local','urn:carwash:api','HS256',false)])expect(await tokens.verify(token)).toBeNull()
  const other=await new SignJWT({}).setProtectedHeader({alg:'HS384',typ:'JWT'}).setSubject('user').setJti('session').setIssuedAt().setExpirationTime('1h').sign(randomBytes(48))
  expect(await tokens.verify(other)).toBeNull()
  expect(await tokens.verify(Buffer.from('{"alg":"none"}').toString('base64url')+'.'+Buffer.from('{"sub":"admin"}').toString('base64url')+'.')).toBeNull()
 })
})
