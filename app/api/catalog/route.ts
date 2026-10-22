import { CATALOG } from '../../../lib/domain';
export async function GET(){return Response.json({services:CATALOG,pricingMode:'illustrative',currency:'USD',guarantee:'24 horas anunciadas. Política pendiente de aprobación.'},{headers:{'Cache-Control':'public,max-age=60'}});}
