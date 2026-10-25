import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Bell, BellRing, Inbox, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { AlertConfiguration } from '@/components/alert-configuration';

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
  const [configOpen, setConfigOpen] = useState(false);
  const isAlerts = tab === 'alertas';
  const tabs = [
    { id: 'alertas' as const, label: 'Alertas', icon: Bell },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: BellRing },
  ];
  return <main className="alerts-screen">
    <header className="alerts-header">
      <div className="alerts-heading"><h1>MIS NOTIFICACIONES</h1><p>Tus avisos de empleo, en un solo lugar</p></div>
      <span className="alerts-counter">0 nuevas</span>
    </header>
    <div className="alerts-tabs" role="tablist" aria-label="Mis notificaciones">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Button key={id} id={`${id}-tab`} variant="ghost" role="tab" aria-selected={tab === id} aria-controls="alerts-panel" className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </Button>
      ))}
    </div>
    <div id="alerts-panel" role="tabpanel" aria-labelledby={isAlerts ? 'alertas-tab' : 'notificaciones-tab'}>
      {isAlerts && <button type="button" className="alerts-create" onClick={() => setConfigOpen(true)}>
        <span className="alerts-create-tile" aria-hidden="true"><Sparkles /></span>
        <span className="alerts-create-copy"><h2>Crear una nueva alerta</h2><p>Recibe avisos de nuevas ofertas</p></span>
        <span className="alerts-add" aria-hidden="true"><Plus /></span>
      </button>}
      <div className="alerts-empty">
        <span className="alerts-empty-icon" aria-hidden="true">{isAlerts ? <Bell /> : <Inbox />}</span>
        <h2>{isAlerts ? 'No hay alertas configuradas' : 'No hay notificaciones'}</h2>
        <p>{isAlerts ? 'Crea una alerta y te avisamos cuando aparezcan ofertas para vos' : 'Todavía no recibiste notificaciones'}</p>
        {isAlerts && <Button type="button" className="alerts-empty-cta" onClick={() => setConfigOpen(true)}>Crear una alerta</Button>}
      </div>
    </div>
    <AppBottomNav active="alertas" />
    <AlertConfiguration open={configOpen} onOpenChange={setConfigOpen} />
  </main>;
}
