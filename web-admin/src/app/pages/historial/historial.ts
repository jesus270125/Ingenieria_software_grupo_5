import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    selector: 'app-historial',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './historial.html',
    styleUrls: ['./historial.css'],
    animations: [
        trigger('slideAnimation', [
            transition(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate('300ms ease-out', style({ transform: 'translateX(0)' }))
            ]),
            transition(':leave', [
                animate('250ms ease-in', style({ transform: 'translateX(100%)' }))
            ])
        ]),
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class HistorialComponent implements OnInit {

    pedidos: Pedido[] = [];
    pedidosFiltrados: Pedido[] = [];
    loading = false;

    // Filtros
    estadoFiltro: string = 'todos';
    fechaInicio: string = '';
    fechaFin: string = '';
    busquedaCliente: string = '';

    // Detalles
    showDetailsModal = false;
    selectedPedido: Pedido | null = null;
    detallesPedido: any = null;

    constructor(
        private pedidoService: PedidoService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadHistorial();
    }

    loadHistorial() {
        this.loading = true;
        this.pedidoService.getAllPedidos().subscribe({
            next: (data) => {
                // Filtrar solo pedidos con estado final (entregado, cancelado)
                this.pedidos = data.filter(p => 
                    p.estado === 'entregado' || p.estado === 'cancelado'
                );
                this.aplicarFiltros();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar historial:', err);
                alert('Error al cargar el historial de pedidos');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    aplicarFiltros() {
        this.pedidosFiltrados = this.pedidos.filter(pedido => {
            // Filtro por estado
            if (this.estadoFiltro !== 'todos' && pedido.estado !== this.estadoFiltro) {
                return false;
            }

            // Filtro por fecha inicio
            if (this.fechaInicio) {
                const fechaPedido = new Date(pedido.created_at);
                const fechaInicioDate = new Date(this.fechaInicio);
                if (fechaPedido < fechaInicioDate) {
                    return false;
                }
            }

            // Filtro por fecha fin
            if (this.fechaFin) {
                const fechaPedido = new Date(pedido.created_at);
                const fechaFinDate = new Date(this.fechaFin);
                fechaFinDate.setHours(23, 59, 59, 999);
                if (fechaPedido > fechaFinDate) {
                    return false;
                }
            }

            // Filtro por cliente
            if (this.busquedaCliente) {
                const busqueda = this.busquedaCliente.toLowerCase();
                const nombreCliente = pedido.usuario_nombre?.toLowerCase() || '';
                if (!nombreCliente.includes(busqueda)) {
                    return false;
                }
            }

            return true;
        });
    }

    limpiarFiltros() {
        this.estadoFiltro = 'todos';
        this.fechaInicio = '';
        this.fechaFin = '';
        this.busquedaCliente = '';
        this.aplicarFiltros();
    }

    verDetalles(pedido: Pedido) {
        this.selectedPedido = pedido;
        this.loading = true;
        
        this.pedidoService.getPedidoById(pedido.id).subscribe({
            next: (data) => {
                this.detallesPedido = data;
                this.showDetailsModal = true;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar detalles:', err);
                alert('Error al cargar los detalles del pedido');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeDetailsModal() {
        this.showDetailsModal = false;
        this.selectedPedido = null;
        this.detallesPedido = null;
    }

    getEstadoBadgeClass(estado: string): string {
        const classes: any = {
            'entregado': 'badge-success',
            'cancelado': 'badge-danger'
        };
        return classes[estado] || 'badge-secondary';
    }

    getTotalPedidos(): number {
        return this.pedidosFiltrados.length;
    }

    getTotalIngresos(): number {
        return this.pedidosFiltrados
            .filter(p => p.estado === 'entregado')
            .reduce((sum, p) => sum + this.toNumber(p.total), 0);
    }

    getPedidosEntregados(): number {
        return this.pedidosFiltrados.filter(p => p.estado === 'entregado').length;
    }

    getPedidosCancelados(): number {
        return this.pedidosFiltrados.filter(p => p.estado === 'cancelado').length;
    }

    toNumber(value: any): number {
        if (typeof value === 'number') return value;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    exportarCSV() {
        if (this.pedidosFiltrados.length === 0) {
            alert('No hay pedidos para exportar');
            return;
        }

        const headers = ['ID', 'Fecha', 'Cliente', 'Dirección', 'Total', 'Estado', 'Método Pago'];
        const rows = this.pedidosFiltrados.map(p => [
            p.id,
            new Date(p.created_at).toLocaleString('es-PE'),
            p.usuario_nombre || '',
            p.direccion || '',
            this.toNumber(p.total).toFixed(2),
            p.estado || '',
            p.metodo_pago || ''
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_pedidos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
