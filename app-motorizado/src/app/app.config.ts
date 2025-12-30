
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token-interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: 'USE_API_URL', useValue: 'http://localhost:4000/api' }, // Example config
        importProvidersFrom(IonicModule.forRoot({})),
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideHttpClient(
            withInterceptors([tokenInterceptor])
        ),
    ],
};
