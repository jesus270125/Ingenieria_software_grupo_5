import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 1. Importamos esto

import { routes } from './app.routes';
// 2. Importamos tu interceptor (Asegúrate que la ruta './interceptors/...' sea la correcta)
import { tokenInterceptor } from './interceptors/token-interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    
    // 3. 👇 ESTA LÍNEA ES CRUCIAL: Habilita HTTP y conecta el interceptor
    provideHttpClient(withInterceptors([tokenInterceptor]))
  ]
};