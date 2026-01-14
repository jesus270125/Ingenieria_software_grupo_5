import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss']
})
export class HistorialPage implements OnInit, OnDestroy {
  pedidos: any[] = [];
  socket: Socket | null = null;

  constructor(
    private pedidoService: PedidoService, 
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ chevronBackOutline });
  }

  goHome() {
    try {
      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (e) {
      // fallback to basic navigate
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    this.loadPedidos();
    // Inicializar socket y listeners
    this.initSocket();
  }

  initSocket() {
    try {
      const socketUrl = environment.socketUrl || 'http://localhost:4000';
      const token = localStorage.getItem('token') || '';
      this.socket = io(socketUrl, { transports: ['websocket'], autoConnect: true, auth: { token: `Bearer ${token}` } });

      this.socket.on('connect', () => {
        console.log('Socket conectado historial', this.socket?.id);
        // join rooms for pedidos already loaded
        this.joinPedidoRooms();
      });

      this.socket.on('connect_error', (err: any) => {
        console.warn('Socket connect_error historial', err);
      });

      this.socket.on('pedido:asignado', (data: any) => {
        console.log('evento pedido:asignado recibido en historial', data);
        this.loadPedidos();
      });

      this.socket.on('pedido:reasignado', (data: any) => {
        console.log('evento pedido:reasignado recibido en historial', data);
        this.loadPedidos();
      });

      this.socket.on('pedido:estado_actualizado', (data: any) => {
        console.log('evento pedido:estado_actualizado recibido en historial', data);
        this.loadPedidos();
        this.mostrarNotificacionEstado(data);
      });
    } catch (e) { console.warn('Socket historial init error', e); }
  }

  joinPedidoRooms() {
    if (!this.socket) return;
    try {
      const token = localStorage.getItem('token') || '';
      for (const p of this.pedidos) {
        if (!p || !p.id) continue;
        this.socket.emit('join_pedido', { token: `Bearer ${token}`, pedidoId: p.id });
      }
    } catch (e) { console.warn('joinPedidoRooms error', e); }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      try { this.socket.disconnect(); } catch (e) { /* ignore */ }
    }
  }

  loadPedidos() {
    this.pedidoService.getPedidos().subscribe({
      next: (res: any) => {
        this.pedidos = Array.isArray(res) ? res : (res.data || []);
        this.pedidos.sort((a: any, b: any) => {
          const da = new Date(a.createdAt || a.fecha || a.created_at || 0).getTime();
          const db = new Date(b.createdAt || b.fecha || b.created_at || 0).getTime();
          return db - da;
        });
      },
      error: (err) => {
        console.error(err);
        this.pedidos = [];
      }
    });
  }

  getEstadoColor(estado: string): string {
    const estadoMap: any = {
      'registrado': 'secondary',
      'asignado': 'primary',
      'en_camino_restaurante': 'warning',
      'en_camino_cliente': 'tertiary',
      'entregado': 'success',
      'cancelado': 'danger'
    };
    return estadoMap[estado] || 'medium';
  }

  getEstadoTexto(estado: string): string {
    const textoMap: any = {
      'registrado': 'Registrado',
      'asignado': 'Asignado',
      'en_camino_restaurante': 'En camino al local',
      'en_camino_cliente': 'En camino a ti',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textoMap[estado] || estado;
  }

  async mostrarNotificacionEstado(data: any) {
    const pedidoId = data.pedidoId || data.pedido_id;
    const nuevoEstado = data.estado || data.nuevoEstado;
    const mensaje = `Pedido #${pedidoId}: ${this.getEstadoTexto(nuevoEstado)}`;
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      color: this.getEstadoColor(nuevoEstado),
      position: 'top',
      buttons: [
        {
          text: 'Ver',
          handler: () => {
            this.router.navigate(['/pedido', pedidoId]);
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
