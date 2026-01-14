import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EvaluacionService, Evaluacion } from '../../services/evaluacion.service';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluaciones.html',
  styleUrls: ['./evaluaciones.css'],
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
export class EvaluacionesPage implements OnInit {
  evaluaciones: Evaluacion[] = [];
  evaluacionesFiltradas: Evaluacion[] = [];
  isLoading = true;
  filtroCalificacion: number = 0;
  
  evaluacionSeleccionada: Evaluacion | null = null;
  respuestaAdmin = '';
  accionTomada = '';
  enviandoRespuesta = false;

  private evaluacionService = inject(EvaluacionService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarEvaluaciones();
  }

  cargarEvaluaciones() {
    this.isLoading = true;
    this.evaluacionService.getAll().subscribe({
      next: (data) => {
        this.evaluaciones = data;
        this.evaluacionesFiltradas = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar evaluaciones:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarPorCalificacion(calificacion: number) {
    this.filtroCalificacion = calificacion;
    if (calificacion === 0) {
      this.evaluacionesFiltradas = this.evaluaciones;
    } else {
      this.evaluacionesFiltradas = this.evaluaciones.filter(e => e.calificacion === calificacion);
    }
  }

  abrirModalRespuesta(evaluacion: Evaluacion) {
    this.evaluacionSeleccionada = evaluacion;
    this.respuestaAdmin = evaluacion.respuesta_admin || '';
    this.accionTomada = evaluacion.accion_tomada || '';
  }

  cerrarModal() {
    this.evaluacionSeleccionada = null;
    this.respuestaAdmin = '';
    this.accionTomada = '';
  }

  enviarRespuesta() {
    if (!this.evaluacionSeleccionada || !this.respuestaAdmin.trim()) {
      alert('Por favor ingresa una respuesta');
      return;
    }

    this.enviandoRespuesta = true;

    this.evaluacionService.responder(
      this.evaluacionSeleccionada.id,
      this.respuestaAdmin,
      this.accionTomada
    ).subscribe({
      next: () => {
        alert('Respuesta guardada correctamente');
        this.cerrarModal();
        this.cargarEvaluaciones();
        this.enviandoRespuesta = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar respuesta:', err);
        alert('Error al guardar la respuesta');
        this.enviandoRespuesta = false;
        this.cdr.detectChanges();
      }
    });
  }

  getEstrellas(calificacion: number): string[] {
    return Array(5).fill('★').map((star, i) => i < calificacion ? '★' : '☆');
  }

  getColorCalificacion(calificacion: number): string {
    if (calificacion >= 4) return '#10b981';
    if (calificacion === 3) return '#f59e0b';
    return '#ef4444';
  }

  getClaseCalificacion(calificacion: number): string {
    if (calificacion === 5) return 'excelente';
    if (calificacion === 4) return 'bueno';
    if (calificacion === 3) return 'regular';
    return 'malo';
  }
}
