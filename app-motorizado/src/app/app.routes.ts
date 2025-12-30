
import { Routes } from '@angular/router';
import { motorizadoGuard } from './guards/motorizado-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
        canActivate: [motorizadoGuard]
    },
    {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.page').then(m => m.MapaPage),
        canActivate: [motorizadoGuard]
    },
    {
        path: 'pedido',
        loadComponent: () => import('./pages/pedido/pedido.page').then(m => m.PedidoPage),
        canActivate: [motorizadoGuard]
    },
];
