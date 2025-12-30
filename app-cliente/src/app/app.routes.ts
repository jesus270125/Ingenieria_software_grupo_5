import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { HomePage } from './pages/home/home.page';
import { ClienteGuard } from './guards/cliente-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },

  { path: 'home', component: HomePage, canActivate: [ClienteGuard] },

  { path: 'locales', loadComponent: () => import('./pages/locales/locales.page').then(m => m.LocalesPage) },
  { path: 'local/:id', loadComponent: () => import('./pages/local/local.page').then(m => m.LocalPage) },

  // Sprint 3 - flujo de pedido
  { path: 'carrito', loadComponent: () => import('./pages/carrito/carrito.page').then(m => m.CarritoPage), canActivate: [ClienteGuard] },
  { path: 'metodo-pago', loadComponent: () => import('./pages/metodo-pago/metodo-pago.page').then(m => m.MetodoPagoPage), canActivate: [ClienteGuard] },
  { path: 'confirmacion', loadComponent: () => import('./pages/confirmacion/confirmacion.page').then(m => m.ConfirmacionPage), canActivate: [ClienteGuard] },
  { path: 'seguimiento', loadComponent: () => import('./pages/seguimiento/seguimiento.page').then(m => m.SeguimientoPage), canActivate: [ClienteGuard] },

  { path: 'historial', loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage), canActivate: [ClienteGuard] },
  { path: 'pedido/:id', loadComponent: () => import('./pages/pedido-detalle/pedido-detalle.page').then(m => m.PedidoDetallePage), canActivate: [ClienteGuard] },

];
