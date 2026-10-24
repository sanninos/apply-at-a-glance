import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBottomNav } from '@/components/app-bottom-nav';

export const Route = createFileRoute('/alertas')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Alertas y notificaciones' },
    { name: 'description', content: 'Tus alertas de empleo y notificaciones en URUJOBS.' },
    { property: 'og:title', content: 'URUJOBS · Alertas y notificaciones' },
    { property: 'og:description', content: 'Consultá tus alertas y avisos de empleo en URUJOBS.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AlertsScreen,
});

function AlertsScreen() {
  const [tab, setTab] = useState<'alertas' | 'notificaciones'>('alertas');
  const isAlerts = tab === 'alertas';
  return <main className="alerts-screen">
    <header className="alerts-header">
      <div className="alerts-heading"><h1>MIS NOTIFICACIONES</h1><p>0 nuevas</p></div>
    </header>
    <div className="alerts-tabs" role="tablist" aria-label="Mis notificaciones">
      <Button id="alerts-tab" variant="ghost" role="tab" aria-selected={isAlerts} aria-controls="alerts-panel" className={isAlerts ? 'selected' : ''} onClick={() => setTab('alertas')}>Alertas</Button>
      <Button id="notifications-tab" variant="ghost" role="tab" aria-selected={!isAlerts} aria-controls="alerts-panel" className={!isAlerts ? 'selected' : ''} onClick={() => setTab('notificaciones')}>Notificaciones</Button>
    </div>
    <div id="alerts-panel" role="tabpanel" aria-labelledby={isAlerts ? 'alerts-tab' : 'notifications-tab'}>
      {isAlerts && <div className="alerts-create">
        <div><h2>Crear una nueva alerta</h2><p>Recibe avisos de nuevas ofertas</p><small>Próximamente</small></div>
        <Button className="alerts-add" size="icon" disabled aria-label="Crear una nueva alerta" title="Crear alertas: próximamente"><Plus /></Button>
      </div>}
      <div className="alerts-empty">
        <Bell aria-hidden="true" />
        <h2>{isAlerts ? 'No hay alertas configuradas' : 'No hay notificaciones'}</h2>
        <p>{isAlerts ? 'Crea una alerta para recibir notificaciones' : 'Todavía no recibiste notificaciones'}</p>
      </div>
    </div>
    <AppBottomNav active="alertas" />
  </main>;
}