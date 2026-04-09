import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { authInterceptor } from './interceptors/auth-interceptor'; // 👈 Cambiado de '.' a '-'
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]) // Esto activa el "guardia de seguridad"
    )
  ]
};