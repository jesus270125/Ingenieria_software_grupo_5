import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const AdminGuard: CanActivateFn = () => {
  const rol = localStorage.getItem('rol');
  const router = inject(Router);

  if (rol === 'administrador') return true;

  router.navigate(['/login']);
  return false;
};
