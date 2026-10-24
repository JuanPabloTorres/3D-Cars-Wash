import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { BookOpen, Clock3, FileText, Tablet, MessageCircle } from 'lucide-react';
import { useApp } from '../../app/store';
import { useCommerce } from '../../app/commerceStore';
import type { ReceptionStep } from '../../domain/commerce';
/** Five spatial displays anchored to the actual counter, usable by pointer or keyboard.
 * These are interface displays, not replacement vehicle/character models. */
const exhibits = [
    { label: 'Servicios', step: 'services', Icon: BookOpen, kind: 'catalogue', x: -7.68 },
    { label: 'Horarios', step: 'information', Icon: Clock3, kind: 'clock', x: -6.84 },
    { label: 'Información', step: 'information', Icon: FileText, kind: 'flyer', x: -6 },
    { label: 'Preparar orden', step: 'vehicle', Icon: Tablet, kind: 'terminal', x: -5.16 },
    { label: 'Preguntas', step: 'questions', Icon: MessageCircle, kind: 'help', x: -4.32 },
] as const;
export function CounterObjects() {
    const app = useApp(), draft = useCommerce(s => s.draft);
    const mobile = useThree(s => s.size.width <= 700);
    if (app.activeView !== 'reception' || app.destination)
        return null;
    const activate = (step: ReceptionStep) => { useCommerce.getState().updateDraft({ step: step === 'vehicle' && !draft.services.length ? 'services' : step }); app.set({ dialogue: true, orderOpen: false, localOpen: false, accountOpen: false, flowOpen: false }); };
    return <group>{exhibits.map(({ label, step, Icon, kind, x }, i) => <Html key={label} position={[mobile ? -6 + (i - 2) * .38 : x, 1.33, .46]} transform rotation={[-.2, 0, 0]} scale={mobile ? .075 : .105} zIndexRange={[10, 0]}><button className={`counter-display counter-${kind}`} aria-label={`Abrir ${label} del mostrador`} onClick={() => activate(step)}><Icon size={32} strokeWidth={1.5}/><strong>{label}</strong><span>{kind === 'clock' ? 'Consultar horario' : kind === 'terminal' ? 'Tu solicitud' : kind === 'catalogue' ? 'Catálogo vigente' : kind === 'flyer' ? 'Conoce el local' : 'Habla con Ana'}</span></button></Html>)}</group>;
}
