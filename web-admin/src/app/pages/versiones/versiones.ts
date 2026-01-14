import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { VersionesService } from '../../services/versiones.service';

@Component({
  selector: 'app-versiones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './versiones.html',
  styleUrls: ['./versiones.css']
})
export class VersionesPage implements OnInit {

  versiones: any[] = [];
  cargando = false;

  constructor(
    private api: VersionesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Escuchar eventos de navegación para recargar datos
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/admin/versiones')) {
        this.cargarVersiones();
      }
    });
  }

  ngOnInit() {
    this.cargarVersiones();
  }

  cargarVersiones() {
    this.cargando = true;
    this.api.listar().subscribe({
      next: (res) => {
        console.log('Versiones recibidas:', res);
        this.versiones = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar versiones:', err);
        this.cargando = false;
      }
    });
  }

  // RF-30: Revertir a una versión anterior
  revertir(version: any) {
    if (!version.datos_anteriores) {
      alert('Esta versión no tiene datos anteriores para restaurar');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de revertir a esta versión?\n\n` +
      `Tipo: ${version.tipo}\n` +
      `Acción: ${version.accion}\n` +
      `Descripción: ${version.descripcion}\n\n` +
      `Esto restaurará los datos al estado anterior.`
    );

    if (!confirmar) return;

    this.cargando = true;
    this.api.revertir(version.id).subscribe({
      next: (res) => {
        alert('Versión revertida correctamente');
        this.cargarVersiones(); // Recargar la lista
      },
      error: (err) => {
        console.error('Error al revertir:', err);
        alert(err.error?.error || 'Error al revertir la versión');
        this.cargando = false;
      }
    });
  }

  puedeRevertir(version: any): boolean {
    // Solo se puede revertir si hay datos anteriores y no es una creación o eliminación
    return version.datos_anteriores && version.accion === 'EDICION';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES');
  }
}
