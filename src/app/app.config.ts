import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core'; // 👇 Se agregó LOCALE_ID aquí
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// 👇 SE AGREGARON ESTAS 3 LÍNEAS PARA EL ESPAÑOL 👇
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // 👇 SE AGREGÓ ESTA LÍNEA EN TUS PROVIDERS 👇
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};