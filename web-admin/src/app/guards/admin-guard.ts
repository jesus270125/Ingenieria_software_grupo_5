import { CanActivateFn, Router } from '@angular/router';

export const AdminGuard: CanActivateFn = () => {

  const rol = localStorage.getItem('rol');
  const router = new Router();

  if (rol === 'administrador') return true;

  router.navigate(['/login']);
  return false;
};
