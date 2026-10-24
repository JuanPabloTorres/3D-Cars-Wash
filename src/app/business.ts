import { useCommerce } from './commerceStore';
import { businessContent, type ServiceContent } from '../domain/businessContent';
import { demoCatalog } from '../reception/catalog';
export function useBusiness() { return useCommerce(s => s.pricing?.business) || businessContent; }
export function useServices(): ServiceContent[] { return useCommerce(s => s.pricing?.services) || demoCatalog; }
