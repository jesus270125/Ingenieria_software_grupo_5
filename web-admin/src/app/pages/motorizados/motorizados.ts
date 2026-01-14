import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, Motorizado } from '../../services/pedido.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-motorizados',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './motorizados.html',
    styleUrls: ['./motorizados.css']
})
export class MotorizadosPage implements OnInit {

    motorizados: Motorizado[] = [];
    pedidos: Pedido[] = [];
    loading = false;

    // Panel derecho de asignación
    showAssignPanel = false;
    selectedMotorizado: Motorizado | null = null;

    constructor(
        private pedidoService: PedidoService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadMotorizados();
        this.loadPedidos();
    }

    loadMotorizados() {
        this.pedidoService.getMotorizados().subscribe({
            next: (data) => {
                this.motorizados = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al cargar motorizados:', err)
        });
    }

    suspenderMotorizado(m: Motorizado) {
        // Usamos 'inactivo' en lugar de 'suspendido' para coincidir con el ENUM de la base de datos (activo/inactivo)
        const esSuspender = m.estado_cuenta !== 'inactivo';
        const accion = esSuspender ? 'suspender' : 'activar';
        const confirmacion = confirm(`¿Estás seguro de que deseas ${accion} al motorizado ${m.nombre}?`);

        if (confirmacion) {
            const nuevoEstado = esSuspender ? 'inactivo' : 'activo';
            this.pedidoService.cambiarEstadoMotorizado(m.id, nuevoEstado).subscribe({
                next: () => {
                    alert(`Motorizado ${esSuspender ? 'suspendido' : 'activado'} correctamente.`);
                    this.loadMotorizados(); // Recargar lista
                },
                error: (err) => {
                    console.error('Error al cambiar estado:', err);
                    alert('Error al cambiar el estado del motorizado.');
                }
            });
        }
    }

    loadPedidos() {
        this.pedidoService.getAllPedidos().subscribe({
            next: (data) => {
                this.pedidos = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error al cargar pedidos:', err)
        });
    }

    // Pedidos actuales asignados al motorizado (no entregados/cancelados)
    currentOrdersCount(m: Motorizado): number {
        return this.pedidos.filter(p => p.motorizado_id === m.id && p.estado !== 'entregado' && p.estado !== 'cancelado').length;
    }

    // Pedidos pendientes sin motorizado
    get pendingPedidos(): Pedido[] {
        return this.pedidos.filter(p => !p.motorizado_id && (p.estado === 'registrado' || p.estado === 'pagado'));
    }

    openAssignPanel(m: Motorizado) {
        this.selectedMotorizado = m;
        this.showAssignPanel = true;
    }

    closeAssignPanel() {
        this.showAssignPanel = false;
        this.selectedMotorizado = null;
    }

    assignPedido(p: Pedido) {
        if (!this.selectedMotorizado) return;

        const count = this.currentOrdersCount(this.selectedMotorizado);
        if (count >= 2) {
            alert('Este motorizado ya tiene el límite de 2 pedidos. No se puede asignar.');
            return;
        }

        this.loading = true;
        this.pedidoService.reassignPedido(p.id, this.selectedMotorizado.id).subscribe({
            next: () => {
                alert('Pedido asignado correctamente');
                this.loadPedidos();
                this.loadMotorizados();
                this.closeAssignPanel();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error asignando pedido:', err);
                alert(err.error?.error || 'Error al asignar pedido');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
