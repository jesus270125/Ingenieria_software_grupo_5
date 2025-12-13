import { Component, OnInit, ViewEncapsulation } from '@angular/core'; // Agregado ViewEncapsulation
import { CommonModule } from '@angular/common'; // Agregado CommonModule (incluye NgFor)
import { RouterModule, Router } from '@angular/router'; // Agregado Router y RouterModule
import { VersionesService } from '../../services/versiones.service';

@Component({
  selector: 'app-versiones',
  standalone: true,
  imports: [CommonModule, RouterModule], // Agregados módulos de UI
  templateUrl: './versiones.html',
  styleUrls: ['./versiones.css'],
  encapsulation: ViewEncapsulation.None // Agregado para heredar estilos globales
})
export class VersionesPage implements OnInit {

  versiones: any[] = [];
  
  // --- Agregado: Control del menú lateral ---
  sidebarOpen = false;

  constructor(
    private api: VersionesService,
    private router: Router // Inyectado Router para navegación
  ) {}

  ngOnInit() {
    this.api.listar().subscribe(res => {
      this.versiones = res;
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