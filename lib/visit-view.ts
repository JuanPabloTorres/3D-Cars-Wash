import type { OrderStatus } from './domain';
export type VisitScene = 'entrance' | 'reception' | 'vehicle' | 'services' | 'quote' | 'waiting' | 'working' | 'delivery';
export function sceneForVisit(panel: string | null, status?: OrderStatus, entered = false): VisitScene {
    if (panel === 'services')
        return 'services';
    if (panel === 'vehicle')
        return 'vehicle';
    if (panel === 'quote')
        return 'quote';
    if (panel === 'reception' || panel === 'login')
        return 'reception';
    if (status === 'working')
        return 'working';
    if (status === 'ready' || status === 'delivered')
        return 'delivery';
    if (status === 'waiting')
        return 'waiting';
    if (status === 'requested')
        return 'vehicle';
    return entered ? 'reception' : 'entrance';
}
export function bayPosition(bay?: number | null): number { return Number.isInteger(bay) && bay! >= 1 && bay! <= 5 ? (bay! - 3) * 6 : 6; }
