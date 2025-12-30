
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';

@Component({
    selector: 'app-pedido',
    templateUrl: './pedido.page.html',
    styleUrls: ['./pedido.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class PedidoPage implements OnInit {
    pedido: Pedido | null = null;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private pedidoService = inject(PedidoService);

    constructor() { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.pedidoService.getPedido(+id).subscribe(p => this.pedido = p);
        }
    }

    cambiarEstado(nuevoEstado: string) {
        if (!this.pedido) return;
        this.pedidoService.updateEstado(this.pedido.id, nuevoEstado).subscribe(() => {
            if (this.pedido) this.pedido.estado = nuevoEstado as any;
            if (nuevoEstado === 'entregado') {
                alert('Pedido completado');
                this.router.navigate(['/home']);
            }
        });
    }

    irAlMapa() {
        if (!this.pedido) return;
        // Pass coordinates to map
        this.router.navigate(['/mapa'], {
            queryParams: {
                latR: this.pedido.lat_restaurante,
                lngR: this.pedido.lng_restaurante,
                latC: this.pedido.lat_cliente,
                lngC: this.pedido.lng_cliente
            }
        });
    }
}
