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
  {
    path: 'locales',
    loadComponent: () => import('./pages/locales/locales.page').then( m => m.LocalesPage)
  },
  {
    path: 'local',
    loadComponent: () => import('./pages/local/local.page').then( m => m.LocalPage)
  },
  {
  path: 'locales',
  loadComponent: () => import('./pages/locales/locales.page').then(m => m.LocalesPage)
},
{
  path: 'local/:id',
  loadComponent: () => import('./pages/local/local.page').then(m => m.LocalPage)
},

];
