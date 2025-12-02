import { CanActivateFn, Router } from '@angular/router';

export const ClienteGuard: CanActivateFn = () => {

  const rol = localStorage.getItem('rol');
  const router = new Router();

  if (rol === 'cliente') return true;

  router.navigate(['/login']);
  return false;
};
