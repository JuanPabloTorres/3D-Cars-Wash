import type {IncomingMessage} from 'node:http'

/** Container port publishing is loopback-only in compose.yaml. Docker forwards
 * that connection from its bridge, so socket loopback is not available there.
 * Host and same-origin/nonce checks remain mandatory; this is not public hosting. */
export function localTransportAllowed(req:Pick<IncomingMessage,'headers'|'socket'>,container=false){
 const host=/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(req.headers.host||'')
 const loopback=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')
 return host&&(loopback||container)
}
