import { Component, ViewEncapsulation } from '@angular/core'; // Agregado ViewEncapsulation
import { CommonModule } from '@angular/common'; // Agregado CommonModule (incluye NgFor y NgIf)
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Agregado Router y RouterModule
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Agregados módulos de UI y Router
  templateUrl: './busqueda.html',
  styleUrls: ['./busqueda.css'],
  encapsulation: ViewEncapsulation.None // Agregado para heredar estilos globales
})
export class BusquedaPage {

  nombre = '';
  categoria = '';
  resultados: any[] = [];
  
  // --- Agregado: Control del menú lateral ---
  sidebarOpen = false;

  constructor(private api: SearchService, private router: Router) {}

  buscar() {
    this.api.buscar(this.nombre, this.categoria).subscribe(res => {
      this.resultados = res;
    });
  }

  // --- Agregado: Funciones para la UI (Igual al Dashboard) ---

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