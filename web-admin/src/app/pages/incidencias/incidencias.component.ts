import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { IncidenciaService, IncidenciaDetalle } from '../../services/incidencia.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.component.html',
  styleUrls: ['./incidencias.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class IncidenciasComponent implements OnInit {
  incidencias: IncidenciaDetalle[] = [];
  incidenciasFiltradas: IncidenciaDetalle[] = [];
  isLoading = true;
  filtroEstado: string = 'todas';
  filtroTipo: string = 'todos';
  
  incidenciaSeleccionada: IncidenciaDetalle | null = null;
  respuesta: string = '';
  nuevoEstado: string = '';
  enviandoRespuesta = false;
  
  apiUrl = environment.apiUrl.replace('/api', '');

  constructor(
    private incidenciaService: IncidenciaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarIncidencias();
  }

  cargarIncidencias(): void {
    this.isLoading = true;
    this.incidenciaService.getAll().subscribe({
      next: (data) => {
        this.incidencias = data;
        this.aplicarFiltros();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar incidencias:', err);
        alert('Error al cargar incidencias');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.incidenciasFiltradas = this.incidencias.filter(inc => {
      const matchEstado = this.filtroEstado === 'todas' || inc.estado === this.filtroEstado;
      const matchTipo = this.filtroTipo === 'todos' || inc.tipo_incidencia === this.filtroTipo;
      return matchEstado && matchTipo;
    });
    this.cdr.detectChanges();
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  getTipoLabel(tipo: string): string {
    const tipos: any = {
      'demora': 'Demora en entrega',
      'mal_estado': 'Mal estado',
      'perdida': 'Pérdida',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoClass(estado: string): string {
    const classes: any = {
      'pendiente': 'badge-warning',
      'en_revision': 'badge-info',
      'resuelto': 'badge-success'
    };
    return classes[estado] || 'badge-secondary';
  }

  getEstadoLabel(estado: string): string {
    const labels: any = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'resuelto': 'Resuelto'
    };
    return labels[estado] || estado;
  }

  getFotoUrl(filename: string): string {
    return `${this.apiUrl}/uploads/${filename}`;
  }

  seleccionarIncidencia(incidencia: IncidenciaDetalle): void {
    this.incidenciaSeleccionada = incidencia;
    this.respuesta = incidencia.respuesta_admin || '';
    this.nuevoEstado = incidencia.estado || 'en_revision';
  }

  cerrarModal(): void {
    this.incidenciaSeleccionada = null;
    this.respuesta = '';
    this.nuevoEstado = '';
  }

  enviarRespuesta(): void {
    if (!this.incidenciaSeleccionada || !this.respuesta.trim() || !this.nuevoEstado) {
      alert('Por favor completa la respuesta y selecciona un estado');
      return;
    }

    this.enviandoRespuesta = true;

    this.incidenciaService.responder(
      this.incidenciaSeleccionada.id!,
      this.respuesta.trim(),
      this.nuevoEstado
    ).subscribe({
      next: () => {
        alert('Respuesta enviada exitosamente');
        this.cerrarModal();
        this.cargarIncidencias();
        this.enviandoRespuesta = false;
      },
      error: (err) => {
        console.error('Error al enviar respuesta:', err);
        alert('Error al enviar la respuesta');
        this.enviandoRespuesta = false;
      }
    });
  }

  contarPorEstado(estado: string): number {
    return this.incidencias.filter(i => i.estado === estado).length;
  }

  contarPorTipo(tipo: string): number {
    return this.incidencias.filter(i => i.tipo_incidencia === tipo).length;
  }
}
