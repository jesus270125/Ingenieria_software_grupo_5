import { Component, OnInit, ViewEncapsulation } from '@angular/core'; // Agregado ViewEncapsulation
import { CommonModule } from '@angular/common'; // Cambiado a CommonModule para soportar toda la UI
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule], // Usamos CommonModule que incluye NgFor y NgIf + utilidades
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
  encapsulation: ViewEncapsulation.None // 👇 Necesario para que el layout herede estilos globales
})
export class ProductosPage implements OnInit {

  productos: any[] = [];
  localId!: number;
  localNombre!: string;
  
  // --- Agregado: Variable para controlar el menú lateral ---
  sidebarOpen = false;

  constructor(
    private api: ProductosService,
    private router: Router
  ) {
    const data = history.state;
    if (data && data.localId) {
      this.localId = data.localId;
      this.localNombre = data.nombre;
    }
  }

  ngOnInit() {
    // Validación opcional: si recargan la página y pierden el state, podrías redirigir
    if (!this.localId) {
       // this.router.navigate(['/locales']); // Descomentar si deseas esta seguridad
    } else {
       this.api.listarPorLocal(this.localId).subscribe(res => {
         this.productos = res;
       });
    }
  }

  crear() {
    this.router.navigate(['/crear-producto'], { 
      state: { localId: this.localId }
    });
  }

  editar(producto: any) {
    this.router.navigate(['/editar-producto', producto.id], { 
      state: { ...producto, localId: this.localId }
    });
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