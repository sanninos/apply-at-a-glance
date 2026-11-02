import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uy.com.urujobs',
  appName: 'UruJobs',
  webDir: '.output/public',
  server: {
    url: 'https://apply-at-a-glance.lovable.app',
    androidScheme: 'https',
    allowNavigation: ['apply-at-a-glance.lovable.app'],
  },
};

export default config;
