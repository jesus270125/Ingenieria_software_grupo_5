import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Ticket {
  id: number;
  usuario_id: number;
  asunto: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  asignado_a: number | null;
  fecha_creacion: string;
  fecha_resolucion: string | null;
  usuario_nombre?: string;
  asignado_nombre?: string;
  respuestas?: any[];
}

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
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
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  ticketSeleccionado: Ticket | null = null;
  mostrarModal = false;
  mostrarRespuesta = false;
  cargando = false;
  
  filtros = {
    estado: '',
    prioridad: '',
    categoria: '',
    busqueda: ''
  };

  nuevoEstado = '';
  nuevaPrioridad = '';
  asignadoA = '';
  nuevaRespuesta = '';

  personal: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Escuchar eventos de navegación para recargar datos
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/admin/tickets')) {
        this.cargarTickets();
        this.cargarPersonal();
      }
    });
  }

  ngOnInit() {
    this.cargarTickets();
    this.cargarPersonal();
  }

  cargarTickets() {
    this.cargando = true;
    const token = localStorage.getItem('token');
    
    this.http.get<any>(`${environment.apiUrl}/tickets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        this.tickets = response.data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
        this.cargando = false;
      }
    });
  }

  cargarPersonal() {
    const token = localStorage.getItem('token');
    
    // Cargar motorizados como personal disponible
    this.http.get<any>(`${environment.apiUrl}/motorizado/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        this.personal = response.motorizados || [];
      },
      error: (error) => {
        console.error('Error al cargar personal:', error);
        // Si falla, dejamos la lista vacía
        this.personal = [];
      }
    });
  }

  get ticketsFiltrados() {
    return this.tickets.filter(ticket => {
      const matchEstado = !this.filtros.estado || ticket.estado === this.filtros.estado;
      const matchPrioridad = !this.filtros.prioridad || ticket.prioridad === this.filtros.prioridad;
      const matchCategoria = !this.filtros.categoria || ticket.categoria === this.filtros.categoria;
      const matchBusqueda = !this.filtros.busqueda || 
        ticket.asunto.toLowerCase().includes(this.filtros.busqueda.toLowerCase()) ||
        ticket.descripcion.toLowerCase().includes(this.filtros.busqueda.toLowerCase());
      
      return matchEstado && matchPrioridad && matchCategoria && matchBusqueda;
    });
  }

  verDetalle(ticket: Ticket) {
    this.ticketSeleccionado = ticket;
    this.nuevoEstado = ticket.estado;
    this.nuevaPrioridad = ticket.prioridad;
    this.asignadoA = ticket.asignado_a?.toString() || '';
    this.mostrarModal = true;
    this.cargarDetalleTicket(ticket.id);
  }

  cargarDetalleTicket(id: number) {
    const token = localStorage.getItem('token');
    
    this.http.get<any>(`${environment.apiUrl}/tickets/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        this.ticketSeleccionado = response.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.ticketSeleccionado = null;
    this.nuevaRespuesta = '';
    this.mostrarRespuesta = false;
  }

  actualizarEstado() {
    if (!this.ticketSeleccionado || !this.nuevoEstado) return;
    
    const token = localStorage.getItem('token');
    
    this.http.put(`${environment.apiUrl}/tickets/${this.ticketSeleccionado.id}/estado`, 
      { estado: this.nuevoEstado },
      { headers: { 'Authorization': `Bearer ${token}` }}
    ).subscribe({
      next: () => {
        alert('Estado actualizado correctamente');
        this.cargarTickets();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar estado');
      }
    });
  }

  actualizarPrioridad() {
    if (!this.ticketSeleccionado || !this.nuevaPrioridad) return;
    
    const token = localStorage.getItem('token');
    
    this.http.put(`${environment.apiUrl}/tickets/${this.ticketSeleccionado.id}/prioridad`, 
      { prioridad: this.nuevaPrioridad },
      { headers: { 'Authorization': `Bearer ${token}` }}
    ).subscribe({
      next: () => {
        alert('Prioridad actualizada correctamente');
        this.cargarTickets();
        if (this.ticketSeleccionado) {
          this.cargarDetalleTicket(this.ticketSeleccionado.id);
        }
      },
      error: (error) => {
        console.error('Error al actualizar prioridad:', error);
        alert('Error al actualizar prioridad');
      }
    });
  }

  asignarTicket() {
    if (!this.ticketSeleccionado || !this.asignadoA) return;
    
    const token = localStorage.getItem('token');
    
    this.http.put(`${environment.apiUrl}/tickets/${this.ticketSeleccionado.id}/asignar`, 
      { asignado_a: parseInt(this.asignadoA) },
      { headers: { 'Authorization': `Bearer ${token}` }}
    ).subscribe({
      next: () => {
        alert('Ticket asignado correctamente');
        this.cargarTickets();
        if (this.ticketSeleccionado) {
          this.cargarDetalleTicket(this.ticketSeleccionado.id);
        }
      },
      error: (error) => {
        console.error('Error al asignar ticket:', error);
        alert('Error al asignar ticket');
      }
    });
  }

  enviarRespuesta() {
    if (!this.ticketSeleccionado || !this.nuevaRespuesta.trim()) return;
    
    const token = localStorage.getItem('token');
    
    this.http.post(`${environment.apiUrl}/tickets/${this.ticketSeleccionado.id}/responder`, 
      { respuesta: this.nuevaRespuesta },
      { headers: { 'Authorization': `Bearer ${token}` }}
    ).subscribe({
      next: () => {
        this.nuevaRespuesta = '';
        this.mostrarRespuesta = false;
        if (this.ticketSeleccionado) {
          this.cargarDetalleTicket(this.ticketSeleccionado.id);
        }
      },
      error: (error) => {
        console.error('Error al enviar respuesta:', error);
        alert('Error al enviar respuesta');
      }
    });
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'abierto': 'badge-warning',
      'en_proceso': 'badge-primary',
      'resuelto': 'badge-success',
      'cerrado': 'badge-secondary'
    };
    return clases[estado] || 'badge-secondary';
  }

  getPrioridadClass(prioridad: string): string {
    const clases: any = {
      'baja': 'badge-success',
      'media': 'badge-warning',
      'alta': 'badge-danger',
      'urgente': 'badge-danger pulse'
    };
    return clases[prioridad] || 'badge-secondary';
  }

  getCategoriaTexto(categoria: string): string {
    const textos: any = {
      'consulta': 'Consulta',
      'problema_tecnico': 'Problema Técnico',
      'pedido': 'Pedido',
      'pago': 'Pago',
      'cuenta': 'Cuenta',
      'otro': 'Otro'
    };
    return textos[categoria] || categoria;
  }

  limpiarFiltros() {
    this.filtros = {
      estado: '',
      prioridad: '',
      categoria: '',
      busqueda: ''
    };
  }
}
