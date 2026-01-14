
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
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
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
    {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage),
        canActivate: [motorizadoGuard]
    },
];
