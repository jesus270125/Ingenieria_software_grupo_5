import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AdminGuard } from './guards/admin-guard';

export const routes: Routes = [

  // ✅ Login
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(c => c.ForgotPasswordComponent)
  },

  // ✅ LAYOUT PRINCIPAL (Dashboard)
  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [AdminGuard],
    children: [

      // ✅ Redirección desde /admin → /admin/inicio
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },

      // ✅ Dashboard principal
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-home').then(c => c.DashboardHomePage)
      },

      // ✅ Locales
      {
        path: 'locales',
        loadComponent: () =>
          import('./pages/locales/locales').then(c => c.LocalesPage)
      },
      {
        path: 'crear-local',
        loadComponent: () =>
          import('./pages/locales/form-local').then(c => c.FormLocalPage)
      },
      {
        path: 'editar-local/:id',
        loadComponent: () =>
          import('./pages/locales/form-local').then(c => c.FormLocalPage)
      },

      // ✅ Productos
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/productos/productos').then(c => c.ProductosPage)
      },
      {
        path: 'crear-producto',
        loadComponent: () =>
          import('./pages/productos/form-producto').then(c => c.FormProductoPage)
      },
      {
        path: 'editar-producto/:id',
        loadComponent: () =>
          import('./pages/productos/form-producto').then(c => c.FormProductoPage)
      },

      // ✅ Búsqueda
      {
        path: 'busqueda',
        loadComponent: () =>
          import('./pages/busqueda/busqueda').then(c => c.BusquedaPage)
      },

      // ✅ Motorizados (lista y asignación)
      {
        path: 'motorizados',
        loadComponent: () =>
          import('./pages/motorizados/motorizados').then(c => c.MotorizadosPage)
      },

      // ✅ Pedidos (RF-11)
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/pedidos/pedidos').then(c => c.PedidosComponent)
      },

      // ✅ Historial de Pedidos (RF-16)
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/historial/historial').then(c => c.HistorialComponent)
      },

      // ✅ Clientes (RF-17)
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes').then(c => c.ClientesComponent)
      },

      // ✅ Configuración (RF-17)
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./pages/configuracion/configuracion').then(c => c.ConfiguracionComponent)
      },

      // ✅ Reportes (RF-18)
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/reportes/reportes').then(c => c.ReportesComponent)
      },

      // ✅ Evaluaciones (RF-22)
      {
        path: 'evaluaciones',
        loadComponent: () =>
          import('./pages/evaluaciones/evaluaciones').then(c => c.EvaluacionesPage)
      },

      // ✅ Incidencias (RF-23)
      {
        path: 'incidencias',
        loadComponent: () =>
          import('./pages/incidencias/incidencias.component').then(c => c.IncidenciasComponent)
      },

      // ✅ Tickets de Soporte (RF-28)
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/tickets/tickets.component').then(c => c.TicketsComponent)
      },

      // ✅ Promociones (RF-24)
      {
        path: 'promociones',
        loadComponent: () =>
          import('./pages/promociones/promociones.component').then(c => c.PromocionesComponent)
      },

      // ✅ Backups (RF-27)
      {
        path: 'backups',
        loadComponent: () =>
          import('./pages/backups/backups').then(c => c.BackupsPage)
      },

      // ✅ Versiones
      {
        path: 'versiones',
        loadComponent: () =>
          import('./pages/versiones/versiones').then(c => c.VersionesPage)
      }
    ]
  },

  // ✅ Rutas inválidas → Login
  {
    path: '**',
    redirectTo: 'login'
  }
];
