import type { CapacitorConfig } from '@anthropic/capacitor-core';

const config: CapacitorConfig = {
  appId: 'com.help911.app',
  appName: 'Help 911',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    backgroundColor: '#07080C',
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Help911'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07080C'
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#07080C',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
