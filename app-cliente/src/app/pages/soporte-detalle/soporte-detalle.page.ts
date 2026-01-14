import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { addIcons } from 'ionicons';
import { helpCircleOutline, flagOutline, checkmarkCircleOutline, personOutline, folderOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-soporte-detalle',
  templateUrl: './soporte-detalle.page.html',
  styleUrls: ['./soporte-detalle.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SoporteDetallePage implements OnInit {
  ticket: any = null;
  cargando = false;
  ticketId!: number;

  constructor(
    private ticketService: TicketService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ helpCircleOutline, flagOutline, checkmarkCircleOutline, personOutline, folderOutline, calendarOutline });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketId = parseInt(id);
      this.cargarTicket();
    }
  }

  async cargarTicket() {
    this.cargando = true;
    try {
      const response = await this.ticketService.obtenerPorId(this.ticketId).toPromise();
      this.ticket = response.data;
    } catch (error) {
      console.error('Error al cargar ticket:', error);
      await this.mostrarError('No se pudo cargar el ticket');
      this.router.navigate(['/soporte']);
    } finally {
      this.cargando = false;
    }
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

  getCategoriaTexto(categoria: string): string {
    const textos: any = {
      'consulta': 'Consulta General',
      'problema_tecnico': 'Problema Técnico',
      'pedido': 'Problema con Pedido',
      'pago': 'Problema de Pago',
      'cuenta': 'Problema con Cuenta',
      'otro': 'Otro'
    };
    return textos[categoria] || categoria;
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}
