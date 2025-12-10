import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common'; // Agregado: Necesario para la UI
import { FormsModule } from '@angular/forms';
import { LocalesService } from '../../services/locales.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-form-local',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Agregado CommonModule aquí
  templateUrl: './form-local.html',
  styleUrls: ['./form-local.css'],
  encapsulation: ViewEncapsulation.None
})
export class FormLocalPage {

  modoEdicion = false;
  id: number | null = null;
  sidebarOpen = false;

  local = {
    nombre: '',
    direccion: '',
    categoria: '',
    imagen: '',
    hora_apertura: '',
    hora_cierre: ''
  };

  constructor(private api: LocalesService, private router: Router) {
    const data = history.state;
    if (data && data.id) {
      this.modoEdicion = true;
      this.id = data.id;
      this.local = data;
    }
  }

  guardar() {
    if (this.modoEdicion) {
      this.api.editar(this.id!, this.local).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    } else {
      this.api.crear(this.local).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    }
  }

  // --- Funciones para la UI ---

  toggleMenu() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Faltaba esta función para el overlay
  closeMenu() {
    this.sidebarOpen = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}