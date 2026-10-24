import {ValidationError} from './errors.ts'
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './business-config.json' with { type: 'json' };
import { businessContent, type PricingConfiguration, type BusinessContent } from '../src/domain/businessContent.ts';
import { demoCatalog } from '../src/reception/catalog.ts';
const localFile = resolve('server/local-business-config.json');
export function initialConfiguration(): PricingConfiguration {
    const defaults = { ...structuredClone(base), services: structuredClone(demoCatalog), business: { ...structuredClone(businessContent), name: process.env.VITE_CARWASH_NAME || businessContent.name } };
    try {
        return validateConfiguration(JSON.parse(readFileSync(localFile, 'utf8')));
    }
    catch {
        return defaults;
    }
}
const text = (value: unknown, max = 500) => typeof value === 'string' && value.trim().length <= max ? value.trim() : (() => { throw new ValidationError('Texto inválido o demasiado largo.'); })();
export function safeContactUrl(value: unknown) { const url = text(value, 300); if (!/^(https:\/\/|mailto:|tel:)/i.test(url))
    throw new ValidationError('El contacto debe usar https, mailto o tel.'); return url; }
export function validateConfiguration(input: PricingConfiguration): PricingConfiguration {
    if (!input || input.currency !== 'USD')
        throw new ValidationError('Esta integración de precios admite USD.');
    const cents = (n: unknown) => n === null || Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 10000000;
    if (!Number.isSafeInteger(input.taxBasisPoints) || input.taxBasisPoints < 0 || input.taxBasisPoints > 10000 || !cents(input.allServicesDiscountCents) || input.allServicesDiscountCents === null)
        throw new ValidationError('Impuesto o descuento inválido.');
    if (!Array.isArray(input.services) || input.services.length < 1 || input.services.length > 40 || new Set(input.services.map(s=>s.id)).size !== input.services.length)
        throw new ValidationError('El catálogo debe contener de 1 a 40 servicios distintos.');
    const services = input.services.map(s => {
        if (!/^[a-z][a-z0-9-]{1,60}$/.test(s.id)||s.id==='inspection'||!text(s.label,90)) throw new ValidationError('Identificador o nombre de servicio inválido.');
        return {id:s.id,label:text(s.label,90),description:text(s.description),includes:text(s.includes),conditions:text(s.conditions),care:text(s.care),available:s.available!==false};
    });
    const prices = {} as PricingConfiguration['prices'];
    for (const category of ['car','pickup','truck','suv'] as const) {
        prices[category]={};
        for(const {id} of services){const price=input.prices?.[category]?.[id];if(!cents(price))throw new ValidationError('Cada tarifa debe ser un importe en centavos o null.');prices[category][id]=price;}
    }
    const durations = {} as NonNullable<PricingConfiguration['durations']>;
    for(const category of ['car','pickup','truck','suv'] as const){
        durations[category]={};
        for(const {id} of services){
            const value=input.durations?.[category]?.[id]??null;
            if(value!==null&&(!Number.isSafeInteger(value)||value<1||value>1440))throw new ValidationError('El tiempo estimado debe ser de 1 a 1440 minutos o quedar vacío.');
            durations[category][id]=value;
        }
    }
    const b = input.business;
    if (!b || !Array.isArray(b.social) || !Array.isArray(b.offers) || b.social.length > 5 || b.offers.length > 10)
        throw new ValidationError('Contenido incompleto.');
    const business: BusinessContent = { name: text(b.name, 60) || 'CarWash Studio', hours: b.hours ? text(b.hours, 500) : null, contact: b.contact ? { label: text(b.contact.label, 100), href: safeContactUrl(b.contact.href) } : null, social: b.social.map(s => ({ label: text(s.label, 60), href: safeContactUrl(s.href) })), offers: b.offers.map(o => { if (!Number.isFinite(Date.parse(o.expiresAt)))
            throw new ValidationError('La oferta requiere vencimiento válido.'); return { id: text(o.id, 80), title: text(o.title, 100), description: text(o.description), expiresAt: o.expiresAt }; }), process: text(b.process, 1000), conditions: text(b.conditions, 1000), updatedAt: new Date().toISOString().slice(0, 10), contactRequestsAvailable: b.contactRequestsAvailable === true };
    return { version: text(input.version, 100), currency: 'USD', taxBasisPoints: input.taxBasisPoints, allServicesDiscountCents: input.allServicesDiscountCents, prices, durations, services, business };
}
export function persistConfiguration(config: PricingConfiguration) { writeFileSync(localFile + '.tmp', JSON.stringify(config, null, 2)); renameSync(localFile + '.tmp', localFile); }
