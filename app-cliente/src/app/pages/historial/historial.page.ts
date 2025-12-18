import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss']
})
export class HistorialPage implements OnInit {
  pedidos: any[] = [];

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.loadPedidos();
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
}
