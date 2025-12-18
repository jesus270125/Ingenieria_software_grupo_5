import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './pedido-detalle.page.html',
  styleUrls: ['./pedido-detalle.page.scss']
})
export class PedidoDetallePage implements OnInit {
  pedido: any = null;

  constructor(private route: ActivatedRoute, private pedidoService: PedidoService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pedidoService.getPedidoById(id).subscribe({
        next: (res: any) => {
          this.pedido = res || res.data || null;
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }
}
