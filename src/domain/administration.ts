import type { CommercialOrder, ContactRequest, VehicleRegistration } from './commerce';
import type { PricingConfiguration } from './businessContent';
import type { OperationEvent } from './contracts';
/** Private loopback administration response. Never publish this aggregate on the
 * public world stream: it includes contact information from local sessions. */
export interface AdminSnapshot {
    users?:{id:string;username:string;name:string;role:'admin'|'employee'|'customer';enabled:boolean;createdAt:string}[];
    mode: 'demo';
    configuration: PricingConfiguration;
    orders: CommercialOrder[];
    clients: {
        name: string;
        vehicle?: VehicleRegistration;
        orderId?: string;
    }[];
    requests: ContactRequest[];
    operation: OperationEvent;
}
