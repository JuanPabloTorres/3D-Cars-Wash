import type { CommercialOrder, ContactRequest, VehicleRegistration } from './commerce';
import type { PricingConfiguration } from './businessContent';
import type { OperationEvent } from './contracts';
/** Private loopback administration response. Never publish this aggregate on the
 * public world stream: it includes contact information from local sessions. */
export interface AdminSnapshot {
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
