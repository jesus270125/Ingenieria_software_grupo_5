import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, Motorizado } from '../../services/pedido.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pedidos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pedidos.html',
    styleUrls: ['./pedidos.css']
})
export class PedidosComponent implements OnInit {

    pedidos: Pedido[] = [];
    motorizados: Motorizado[] = [];
    loading = false;

    // Modal de reasignación
    showReassignModal = false;
    selectedPedido: Pedido | null = null;
    selectedMotorizadoId: number | null = null;

    constructor(
        private pedidoService: PedidoService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadPedidos();
        this.loadMotorizados();
    }

    loadPedidos() {
        this.loading = true;
        this.pedidoService.getAllPedidos().subscribe({
            next: (data) => {
                this.pedidos = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar pedidos:', err);
                alert('Error al cargar los pedidos');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadMotorizados() {
        this.pedidoService.getMotorizados().subscribe({
            next: (data) => {
                this.motorizados = data;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar motorizados:', err);
                this.cdr.detectChanges();
            }
        });
    }

    openReassignModal(pedido: Pedido) {
        this.selectedPedido = pedido;
        this.selectedMotorizadoId = pedido.motorizado_id;
        this.showReassignModal = true;
    }

    closeReassignModal() {
        this.showReassignModal = false;
        this.selectedPedido = null;
        this.selectedMotorizadoId = null;
    }

    confirmReassign() {
        if (!this.selectedPedido || !this.selectedMotorizadoId) {
            alert('Debe seleccionar un motorizado');
            return;
        }

        this.loading = true;
        this.pedidoService.reassignPedido(this.selectedPedido.id, this.selectedMotorizadoId).subscribe({
            next: (response) => {
                alert('Pedido reasignado exitosamente');
                this.closeReassignModal();
                this.loadPedidos(); // Recargar lista
            },
            error: (err) => {
                console.error('Error al reasignar pedido:', err);
                alert(err.error?.error || 'Error al reasignar el pedido');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getEstadoBadgeClass(estado: string): string {
        const classes: any = {
            'registrado': 'badge-primary',
            'asignado': 'badge-info',
            'en_camino': 'badge-warning',
            'entregado': 'badge-success',
            'cancelado': 'badge-danger'
        };
        return classes[estado] || 'badge-secondary';
    }

    getMotorizadoNombre(pedido: Pedido): string {
        // Si no tiene motorizado asignado
        if (!pedido.motorizado_id) return 'Sin asignar';

        // Si viene el nombre del motorizado desde el backend
        if (pedido.motorizado_nombre) {
            return pedido.motorizado_nombre;
        }

        // Si no, buscar en la lista de motorizados
        const motorizado = this.motorizados.find(m => m.id === pedido.motorizado_id);
        return motorizado ? motorizado.nombre : `Motorizado #${pedido.motorizado_id}`;
    }
}

