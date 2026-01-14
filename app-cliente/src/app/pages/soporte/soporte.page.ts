import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { TicketService, Ticket } from '../../services/ticket.service';
import { addIcons } from 'ionicons';
import { closeCircleOutline, addCircleOutline, helpCircleOutline, chatbubblesOutline, calendarOutline, sendOutline, flagOutline, folderOutline } from 'ionicons/icons';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SoportePage implements OnInit {
  tickets: any[] = [];
  nuevoTicket: Ticket = {
    asunto: '',
    descripcion: '',
    categoria: 'consulta',
    prioridad: 'media'
  };
  
  categorias = [
    { value: 'consulta', label: 'Consulta General' },
    { value: 'problema_tecnico', label: 'Problema Técnico' },
    { value: 'pedido', label: 'Problema con Pedido' },
    { value: 'pago', label: 'Problema de Pago' },
    { value: 'cuenta', label: 'Problema con Cuenta' },
    { value: 'otro', label: 'Otro' }
  ];

  prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  mostrarFormulario = false;
  cargando = false;

  constructor(
    private ticketService: TicketService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({ closeCircleOutline, addCircleOutline, helpCircleOutline, chatbubblesOutline, calendarOutline, sendOutline, flagOutline, folderOutline });
  }

  ngOnInit() {
    this.cargarTickets();
  }

  ionViewWillEnter() {
    this.cargarTickets();
  }

  async cargarTickets() {
    this.cargando = true;
    try {
      const response = await this.ticketService.obtenerMisTickets().toPromise();
      this.tickets = response.data || [];
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      await this.mostrarError('No se pudieron cargar los tickets');
    } finally {
      this.cargando = false;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetearFormulario();
    }
  }

  async crearTicket() {
    if (!this.nuevoTicket.asunto || !this.nuevoTicket.descripcion) {
      await this.mostrarError('Por favor completa todos los campos');
      return;
    }

    this.cargando = true;
    try {
      await this.ticketService.crear(this.nuevoTicket).toPromise();
      await this.mostrarExito('Ticket creado exitosamente');
      this.resetearFormulario();
      this.mostrarFormulario = false;
      await this.cargarTickets();
    } catch (error) {
      console.error('Error al crear ticket:', error);
      await this.mostrarError('No se pudo crear el ticket');
    } finally {
      this.cargando = false;
    }
  }

  resetearFormulario() {
    this.nuevoTicket = {
      asunto: '',
      descripcion: '',
      categoria: 'consulta' as const,
      prioridad: 'media' as const
    };
  }

  verDetalle(ticketId: number) {
    this.router.navigate(['/soporte-detalle', ticketId]);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'abierto': 'warning',
      'en_proceso': 'primary',
      'resuelto': 'success',
      'cerrado': 'medium'
    };
    return colores[estado] || 'medium';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'abierto': 'Abierto',
      'en_proceso': 'En Proceso',
      'resuelto': 'Resuelto',
      'cerrado': 'Cerrado'
    };
    return textos[estado] || estado;
  }

  getPrioridadColor(prioridad: string): string {
    const colores: any = {
      'baja': 'success',
      'media': 'warning',
      'alta': 'danger',
      'urgente': 'danger'
    };
    return colores[prioridad] || 'medium';
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarExito(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}
