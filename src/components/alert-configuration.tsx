import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { ALERT_RADIUS } from '@/lib/alert-preferences';

const types = ['Por empresa', 'Por puesto', 'Proximidad'] as const;

export function AlertConfiguration({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [type, setType] = useState<(typeof types)[number]>('Proximidad');
  const [radius, setRadius] = useState<number>(ALERT_RADIUS.initial);
  const [notice, setNotice] = useState(false);
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="alert-configuration">
      <div className="alert-config-content">
        <header className="alert-config-header">
          <DrawerTitle>Configurar Alertas</DrawerTitle>
          <DrawerDescription>Configura tus preferencias de alertas</DrawerDescription>
        </header>
        <fieldset className="alert-type-field">
          <legend>Tipo de Alerta</legend>
          <div className="alert-type-options" role="group" aria-label="Tipo de Alerta">
            {types.map(option => <Button key={option} variant="outline" aria-pressed={type === option} className={type === option ? 'selected' : ''} onClick={() => { setType(option); setNotice(false); }}>{type === option && <Check />}{option}</Button>)}
          </div>
        </fieldset>
        {type === 'Proximidad' ? <div className="alert-radius-field">
          <div><label id="alert-radius-label">Área de búsqueda</label><output>{radius} km</output></div>
          <Slider aria-labelledby="alert-radius-label" aria-valuetext={`${radius} kilómetros`} min={ALERT_RADIUS.min} max={ALERT_RADIUS.max} step={1} value={[radius]} onValueChange={values => { setRadius(values[0] ?? ALERT_RADIUS.initial); setNotice(false); }} className="alert-radius-slider" />
          <div className="alert-radius-limits"><span>{ALERT_RADIUS.min} km</span><span>{ALERT_RADIUS.max} km</span></div>
        </div> : <div className="alert-search-field"><label htmlFor="alert-search">{type === 'Por empresa' ? 'Empresa' : 'Puesto'}</label><input id="alert-search" key={type} placeholder={type === 'Por empresa' ? 'Nombre de la empresa' : 'Puesto que estás buscando'} onChange={() => setNotice(false)} /></div>}
        {notice && <p className="alert-config-notice" role="status">La creación de alertas todavía no está disponible. Tus preferencias no se guardaron.</p>}
        <Button className="alert-config-submit" onClick={() => setNotice(true)}>Configurar Alerta</Button>
      </div>
    </DrawerContent>
  </Drawer>;
}