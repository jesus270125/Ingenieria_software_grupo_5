
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { addIcons } from 'ionicons';
import { 
    personOutline, 
    logOutOutline, 
    bicycleOutline, 
    receiptOutline, 
    restaurantOutline, 
    homeOutline, 
    arrowForwardOutline, 
    chevronForwardOutline 
} from 'ionicons/icons';

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

    constructor() {
        addIcons({
            personOutline,
            logOutOutline,
            bicycleOutline,
            receiptOutline,
            restaurantOutline,
            homeOutline,
            arrowForwardOutline,
            chevronForwardOutline
        });
    }

    ngOnInit() {
        this.loadDisponibilidad();
        this.loadPedidos();
        // escuchar eventos de asignación en tiempo real
        try {
            this.ubicacionService.pedidoEvents$.subscribe(evt => {
                if (!evt) return;
                if (evt.type === 'asignado' || evt.type === 'reasignado') {
                    // recargar lista de pedidos asignados
                    this.loadPedidos();
                }
            });
        } catch (e) { console.warn('subscribe pedidoEvents error', e); }
    }

    loadDisponibilidad() {
        // RF-21: Cargar estado de disponibilidad desde el backend
        const user = this.authService.getUser();
        if (user && user.disponible !== undefined) {
            this.isAvailable = user.disponible === 1;
        }
        
        // También consultar al backend para tener el estado más actualizado
        this.pedidoService.getPerfilMotorizado().subscribe({
            next: (perfil) => {
                this.isAvailable = perfil.disponible === 1;
            },
            error: (err) => {
                console.warn('No se pudo cargar el estado de disponibilidad:', err);
            }
        });
    }

    loadPedidos() {
        this.pedidoService.getPedidosAsignados().subscribe(res => {
            this.pedidos = res;
            console.log('Pedidos asignados:', this.pedidos);
            if (this.pedidos && this.pedidos.length > 0) {
                this.pedidos.forEach(p => {
                    console.log(`Pedido #${p.id} estado:`, p.estado);
                });
            }
        });
    }

    toggleAvailability(event: any) {
        this.isAvailable = event.detail.checked;
        this.pedidoService.cambiarDisponibilidad(this.isAvailable).subscribe();
    }


    verPedido(id: number) {
        this.router.navigate(['/pedido', { id }]); // or passing state
    }

    getEstado(p: Pedido): string {
        // Si el campo no existe, es nulo o vacío, mostrar 'Sin estado'
        return (p && typeof p.estado === 'string' && p.estado.trim().length > 0) ? p.estado : 'Sin estado';
    }

    getEstadoClass(p: Pedido): string {
        const estado = this.getEstado(p).toLowerCase();
        if (estado.includes('preparando')) return 'preparando';
        if (estado.includes('camino') || estado.includes('ruta')) return 'en-camino';
        if (estado.includes('entregado')) return 'entregado';
        if (estado.includes('asignado')) return 'asignado';
        return 'default';
    }

    logout() {
        this.authService.logout();
    }

    irAPerfil() {
        this.router.navigate(['/perfil']);
    }

    doRefresh(event: any) {
        this.loadPedidos();
        event.target.complete();
    }
}
