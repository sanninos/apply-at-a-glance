declare global {
  interface Window { initRadarMap?: () => void }
}

let mapsPromise: Promise<void> | undefined;
export function loadRadarMap(): Promise<void> {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    const channel = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'];
    if (!key) { reject(new Error('Falta conectar Google Maps.')); return; }
    if (window.google?.maps?.Map) { resolve(); return; }
    window.initRadarMap = () => { resolve(); delete window.initRadarMap; };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=initRadarMap&channel=${encodeURIComponent(channel || '')}`;
    script.async = true;
    script.onerror = () => reject(new Error('No pudimos cargar el mapa.'));
    document.head.appendChild(script);
  });
  return mapsPromise;
}