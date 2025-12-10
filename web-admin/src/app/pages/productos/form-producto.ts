import { Component, ViewEncapsulation } from '@angular/core'; // Agregado ViewEncapsulation
import { CommonModule } from '@angular/common'; // Agregado CommonModule para la UI
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Agregado RouterModule
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Agregados módulos necesarios
  templateUrl: './form-producto.html',
  styleUrls: ['./form-producto.css'],
  encapsulation: ViewEncapsulation.None // Agregado para heredar estilos globales
})
export class FormProductoPage {

  modoEdicion = false;
  id: number | null = null;
  sidebarOpen = false; // Agregado: Control del menú lateral

  producto = {
    local_id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: ''
  };

  constructor(
    private api: ProductosService,
    private router: Router
  ) {
    const data = history.state;

    if (data.localId) {
      this.producto.local_id = data.localId;
    }

    if (data && data.id) {
      this.modoEdicion = true;
      this.id = data.id;
      this.producto = data;
    }
  }

  guardar() {
    if (this.modoEdicion) {
      this.api.editar(this.id!, this.producto).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    } else {
      this.api.crear(this.producto).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    }
  }

  // --- Agregado: Funciones para la UI (Sidebar y Logout) ---

  toggleMenu() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeMenu() {
    this.sidebarOpen = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}