
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, RouterModule]
})
export class HomePage implements OnInit {
    isAvailable = false;
    pedidos: Pedido[] = [];

    private pedidoService = inject(PedidoService);
    private authService = inject(AuthService);
    private ubicacionService = inject(UbicacionService); // init tracking
    private router = inject(Router);

    constructor() { }

    ngOnInit() {
        this.loadPedidos();
    }

    loadPedidos() {
        this.pedidoService.getPedidosAsignados().subscribe(res => {
            this.pedidos = res;
        });
    }

    toggleAvailability(event: any) {
        this.isAvailable = event.detail.checked;
        this.pedidoService.cambiarDisponibilidad(this.isAvailable).subscribe();
    }

    verPedido(id: number) {
        this.router.navigate(['/pedido', { id }]); // or passing state
    }

    logout() {
        this.authService.logout();
    }

    doRefresh(event: any) {
        this.loadPedidos();
        event.target.complete();
    }
}
