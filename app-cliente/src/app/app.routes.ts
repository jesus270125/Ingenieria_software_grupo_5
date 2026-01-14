import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { HomePage } from './pages/home/home.page';
import { ClienteGuard } from './guards/cliente-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginPage },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage) },
  { path: 'register', component: RegisterPage },

  { path: 'home', component: HomePage, canActivate: [ClienteGuard] },
  { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage), canActivate: [ClienteGuard] },

  {
    path: 'locales',
    loadComponent: () => import('./pages/locales/locales.component').then(m => m.LocalesComponent)
  },
  {
    path: 'locales/:id',
    loadComponent: () => import('./pages/detalle-local/detalle-local.component').then(m => m.DetalleLocalComponent)
  },
  { path: 'carrito', loadComponent: () => import('./pages/carrito/carrito.page').then(m => m.CarritoPage), canActivate: [ClienteGuard] },
  { path: 'metodo-pago', loadComponent: () => import('./pages/metodo-pago/metodo-pago.component').then(m => m.MetodoPagoComponent), canActivate: [ClienteGuard] },
  { path: 'confirmacion', loadComponent: () => import('./pages/confirmacion/confirmacion.component').then(m => m.ConfirmacionComponent), canActivate: [ClienteGuard] },
  { path: 'historial', loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage), canActivate: [ClienteGuard] },
  { path: 'pedido/:id', loadComponent: () => import('./pages/pedido-detalle/pedido-detalle.page').then(m => m.PedidoDetallePage), canActivate: [ClienteGuard] },
  { path: 'mis-evaluaciones', loadComponent: () => import('./pages/mis-evaluaciones/mis-evaluaciones.page').then(m => m.MisEvaluacionesPage), canActivate: [ClienteGuard] },
  { path: 'reportar-incidencia', loadComponent: () => import('./pages/reportar-incidencia/reportar-incidencia.page').then(m => m.ReportarIncidenciaPage), canActivate: [ClienteGuard] },
  { path: 'mis-reportes', loadComponent: () => import('./pages/mis-reportes/mis-reportes.page').then(m => m.MisReportesPage), canActivate: [ClienteGuard] },
  { path: 'soporte', loadComponent: () => import('./pages/soporte/soporte.page').then(m => m.SoportePage), canActivate: [ClienteGuard] },
  { path: 'soporte-detalle/:id', loadComponent: () => import('./pages/soporte-detalle/soporte-detalle.page').then(m => m.SoporteDetallePage), canActivate: [ClienteGuard] },

];
