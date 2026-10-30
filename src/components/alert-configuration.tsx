import { useState } from 'react';
import { Building2, BriefcaseBusiness, MapPinned } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { ALERT_RADIUS } from '@/lib/alert-preferences';

const types = ['Por empresa', 'Por puesto', 'Proximidad'] as const;
const typeIcons = { 'Por empresa': Building2, 'Por puesto': BriefcaseBusiness, 'Proximidad': MapPinned } as const;

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
        <div className="alert-type-field">
          <label id="alert-type-label">Tipo de alerta</label>
          <Select value={type} onValueChange={value => { setType(value as (typeof types)[number]); setNotice(false); }}>
            <SelectTrigger aria-labelledby="alert-type-label" className="alert-type-select"><SelectValue /></SelectTrigger>
            <SelectContent className="alert-type-menu">
              {types.map(option => { const Icon = typeIcons[option]; return <SelectItem key={option} value={option}><span className="alert-type-item"><Icon />{option}</span></SelectItem>; })}
            </SelectContent>
          </Select>
        </div>
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