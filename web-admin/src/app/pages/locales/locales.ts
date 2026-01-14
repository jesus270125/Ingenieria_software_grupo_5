import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalesService } from '../../services/locales.service';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './locales.html',
  styleUrls: ['./locales.css']
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  localesFiltrados: any[] = [];
  busqueda: string = '';
  cargando: boolean = true;

  constructor(
    private api: LocalesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.cargando = true;

    this.api.listar().subscribe({
      next: (res) => {
        this.locales = res;
        this.filtrarLocales();
        this.cargando = false;
        this.cdr.detectChanges();   // ✅ ESTO SOLUCIONA EL PROBLEMA
      },
      error: (err) => {
        console.error('Error al cargar locales:', err);
        this.cargando = false;
      }
    });
  }

  filtrarLocales() {
    if (!this.busqueda.trim()) {
      this.localesFiltrados = [...this.locales];
      return;
    }

    const termino = this.busqueda.toLowerCase().trim();
    this.localesFiltrados = this.locales.filter(local => {
      return (
        local.nombre?.toLowerCase().includes(termino) ||
        local.direccion?.toLowerCase().includes(termino) ||
        local.estado?.toLowerCase().includes(termino)
      );
    });
  }

  crear() {
    this.router.navigate(['/admin/crear-local']);
  }

  verProductos(local: any) {
    // Navega a la lista de productos pasando el localId y nombre por query params
    this.router.navigate(['/admin/productos'], { queryParams: { localId: local.id, nombre: local.nombre } });
  }

  editar(local: any) {
    this.router.navigate(['/admin/editar-local', local.id], { state: local });
  }

  esAbierto(local: any): boolean {
    if (!local.hora_apertura || !local.hora_cierre) return false;

    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

    const [aperturaH, aperturaM] = local.hora_apertura.split(':').map(Number);
    const [cierreH, cierreM] = local.hora_cierre.split(':').map(Number);

    const minutosApertura = aperturaH * 60 + (aperturaM || 0);
    const minutosCierre = cierreH * 60 + (cierreM || 0);

    if (minutosApertura < minutosCierre) {
      // Horario normal (ej: 09:00 a 18:00)
      return minutosActuales >= minutosApertura && minutosActuales < minutosCierre;
    } else {
      // Cruza la medianoche (ej: 22:00 a 06:00)
      return minutosActuales >= minutosApertura || minutosActuales < minutosCierre;
    }
  }
}
