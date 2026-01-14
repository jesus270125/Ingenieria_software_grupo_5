import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { PromocionService } from '../../services/promocion.service';

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promociones.component.html',
  styleUrls: ['./promociones.component.css'],
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
export class PromocionesComponent implements OnInit {
  promociones: any[] = [];
  estadisticas: any = {};
  filtroEstado: string = 'todas';
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  // Formulario
  promocionForm: any = {
    codigo: '',
    descripcion: '',
    tipo_descuento: 'porcentaje',
    valor: 0,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activa',
    uso_maximo: null,
    monto_minimo: 0
  };

  constructor(
    private promocionService: PromocionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPromociones();
    this.cargarEstadisticas();
  }

  cargarPromociones() {
    this.promocionService.getAll().subscribe({
      next: (res) => {
        this.promociones = res.promociones || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar promociones:', err)
    });
  }

  cargarEstadisticas() {
    this.promocionService.getEstadisticas().subscribe({
      next: (res) => {
        this.estadisticas = res.estadisticas || {};
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  get promocionesFiltradas() {
    if (this.filtroEstado === 'todas') {
      return this.promociones;
    }
    return this.promociones.filter(p => p.estado === this.filtroEstado);
  }

  abrirModalCrear() {
    this.modoEdicion = false;
    this.promocionForm = {
      codigo: '',
      descripcion: '',
      tipo_descuento: 'porcentaje',
      valor: 0,
      fecha_inicio: this.formatDateForInput(new Date()),
      fecha_fin: this.formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      estado: 'activa',
      uso_maximo: null,
      monto_minimo: 0
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(promocion: any) {
    this.modoEdicion = true;
    this.promocionForm = {
      id: promocion.id,
      codigo: promocion.codigo,
      descripcion: promocion.descripcion,
      tipo_descuento: promocion.tipo_descuento,
      valor: promocion.valor,
      fecha_inicio: this.formatDateForInput(new Date(promocion.fecha_inicio)),
      fecha_fin: this.formatDateForInput(new Date(promocion.fecha_fin)),
      estado: promocion.estado,
      uso_maximo: promocion.uso_maximo,
      monto_minimo: promocion.monto_minimo || 0
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarPromocion() {
    // Validar
    if (!this.promocionForm.codigo || !this.promocionForm.descripcion || !this.promocionForm.valor) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    if (this.promocionForm.tipo_descuento === 'porcentaje' && 
        (this.promocionForm.valor < 0 || this.promocionForm.valor > 100)) {
      alert('El porcentaje debe estar entre 0 y 100');
      return;
    }

    const payload = {
      codigo: this.promocionForm.codigo.toUpperCase(),
      descripcion: this.promocionForm.descripcion,
      tipo_descuento: this.promocionForm.tipo_descuento,
      valor: parseFloat(this.promocionForm.valor),
      fecha_inicio: this.formatDateForBackend(this.promocionForm.fecha_inicio),
      fecha_fin: this.formatDateForBackend(this.promocionForm.fecha_fin),
      estado: this.promocionForm.estado,
      uso_maximo: this.promocionForm.uso_maximo || null,
      monto_minimo: parseFloat(this.promocionForm.monto_minimo) || 0
    };

    if (this.modoEdicion) {
      this.promocionService.update(this.promocionForm.id, payload).subscribe({
        next: () => {
          alert('Promoción actualizada exitosamente');
          this.cerrarModal();
          this.cargarPromociones();
          this.cargarEstadisticas();
        },
        error: (err) => {
          const msg = err.error?.message || 'Error al actualizar promoción';
          alert(msg);
        }
      });
    } else {
      this.promocionService.crear(payload).subscribe({
        next: () => {
          alert('Promoción creada exitosamente');
          this.cerrarModal();
          this.cargarPromociones();
          this.cargarEstadisticas();
        },
        error: (err) => {
          const msg = err.error?.message || 'Error al crear promoción';
          alert(msg);
        }
      });
    }
  }

  cambiarEstado(id: number, nuevoEstado: string) {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;

    this.promocionService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => {
        alert('Estado actualizado');
        this.cargarPromociones();
        this.cargarEstadisticas();
      },
      error: (err) => alert('Error al cambiar estado')
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    this.promocionService.delete(id).subscribe({
      next: () => {
        alert('Promoción eliminada');
        this.cargarPromociones();
        this.cargarEstadisticas();
      },
      error: (err) => alert('Error al eliminar promoción')
    });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private formatDateForBackend(dateString: string): string {
    // dateString viene como "2025-01-10T14:30"
    // Backend espera formato MySQL: "2025-01-10 14:30:00"
    if (!dateString) return '';
    return dateString.replace('T', ' ') + ':00';
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch(estado) {
      case 'activa': return 'badge-activa';
      case 'inactiva': return 'badge-inactiva';
      case 'expirada': return 'badge-expirada';
      default: return '';
    }
  }
}
