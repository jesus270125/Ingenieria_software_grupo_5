import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AdminGuard } from './guards/admin-guard';

// ✅ Carga diferida de componentes standalone
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

  // ✅ LAYOUT PRINCIPAL (Dashboard)
  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [AdminGuard],
    children: [

      // ✅ Página inicial dentro del dashboard
      {
        path: '',
        loadComponent: () =>
          import('./pages/locales/locales').then(c => c.LocalesPage)
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
