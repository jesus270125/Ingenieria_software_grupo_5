import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LocalesService } from '../../services/locales.service';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './locales.html',
  styleUrls: ['./locales.css'],
  encapsulation: ViewEncapsulation.None
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  cargando: boolean = true;
  
  // --- Agregado: Estado para el menú móvil ---
  sidebarOpen: boolean = false;

  constructor(private api: LocalesService, private router: Router) {}

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.cargando = true;
    this.api.listar().subscribe({
      next: (res) => {
        this.locales = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar locales:', err);
        this.cargando = false;
      }
    });
  }

  crear() {
    this.router.navigate(['/crear-local']);
  }

  editar(local: any) {
    this.router.navigate(['/editar-local', local.id], { state: local });
  }

  // --- Agregado: Funciones para la UI (Sidebar y Logout) ---

  toggleMenu() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeMenu() {
    this.sidebarOpen = false;
  }

  logout() {
    // Limpiar sesión y redirigir
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }
}