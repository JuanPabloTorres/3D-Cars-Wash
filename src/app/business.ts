import { useCommerce } from './commerceStore';
import { businessContent, type ServiceContent } from '../domain/businessContent';
import { demoCatalog } from '../reception/catalog';
import { useEffect, useState } from 'react';
export function useBusiness() { return useCommerce(s => s.pricing?.business) || businessContent; }
export function useServices(): ServiceContent[] { return useCommerce(s => s.pricing?.services) || demoCatalog; }
/** All offer displays expire together, including while the customer stays in one view. */
export function useActiveOffers() {
 const business=useBusiness(),[now,setNow]=useState(Date.now)
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[])
 return business.offers.filter(offer=>Date.parse(offer.expiresAt)>now)
}
