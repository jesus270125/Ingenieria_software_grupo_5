import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ClienteService, Cliente, EstadisticasCliente } from '../../services/cliente.service';

@Component({
    selector: 'app-clientes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './clientes.html',
    styleUrls: ['./clientes.css'],
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
export class ClientesComponent implements OnInit {
    clientes: Cliente[] = [];
    clientesFiltrados: Cliente[] = [];
    loading = false;

    // Filtros
    busqueda: string = '';
    estadoFiltro: string = 'todos';

    // Modal de detalles
    showDetailsModal = false;
    selectedCliente: Cliente | null = null;
    estadisticas: EstadisticasCliente | null = null;

    constructor(
        private clienteService: ClienteService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadClientes();
    }

    loadClientes() {
        this.loading = true;
        this.clienteService.listarClientes().subscribe({
            next: (data) => {
                this.clientes = data;
                this.aplicarFiltros();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar clientes:', err);
                alert('Error al cargar la lista de clientes');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    aplicarFiltros() {
        this.clientesFiltrados = this.clientes.filter(cliente => {
            // Filtro por búsqueda
            if (this.busqueda) {
                const busquedaLower = this.busqueda.toLowerCase();
                const matchNombre = cliente.nombre?.toLowerCase().includes(busquedaLower);
                const matchTelefono = cliente.telefono?.includes(this.busqueda);
                const matchCorreo = cliente.correo?.toLowerCase().includes(busquedaLower);
                
                if (!matchNombre && !matchTelefono && !matchCorreo) {
                    return false;
                }
            }

            // Filtro por estado
            if (this.estadoFiltro !== 'todos' && cliente.estado_cuenta !== this.estadoFiltro) {
                return false;
            }

            return true;
        });
    }

    limpiarFiltros() {
        this.busqueda = '';
        this.estadoFiltro = 'todos';
        this.aplicarFiltros();
    }

    verDetalles(cliente: Cliente) {
        this.selectedCliente = cliente;
        this.loading = true;
        
        this.clienteService.getEstadisticas(cliente.id).subscribe({
            next: (stats) => {
                this.estadisticas = stats;
                this.showDetailsModal = true;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar estadísticas:', err);
                this.estadisticas = null;
                this.showDetailsModal = true;
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    cambiarEstado(cliente: Cliente, nuevoEstado: string) {
        if (!confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
            return;
        }

        this.loading = true;
        this.clienteService.updateEstado(cliente.id, nuevoEstado).subscribe({
            next: () => {
                alert('Estado actualizado correctamente');
                this.loadClientes();
                if (this.selectedCliente?.id === cliente.id) {
                    this.closeDetailsModal();
                }
            },
            error: (err) => {
                console.error('Error al cambiar estado:', err);
                alert('Error al cambiar el estado del cliente');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeDetailsModal() {
        this.showDetailsModal = false;
        this.selectedCliente = null;
        this.estadisticas = null;
    }

    getEstadoBadgeClass(estado: string): string {
        return estado === 'activo' ? 'badge-success' : 'badge-danger';
    }

    getTotalClientes(): number {
        return this.clientesFiltrados.length;
    }

    getClientesActivos(): number {
        return this.clientesFiltrados.filter(c => c.estado_cuenta === 'activo').length;
    }

    getClientesInactivos(): number {
        return this.clientesFiltrados.filter(c => c.estado_cuenta === 'inactivo').length;
    }

    exportarCSV() {
        if (this.clientesFiltrados.length === 0) {
            alert('No hay clientes para exportar');
            return;
        }

        const headers = ['ID', 'Nombre', 'DNI/RUC', 'Teléfono', 'Correo', 'Dirección', 'Estado', 'Fecha Registro'];
        const rows = this.clientesFiltrados.map(c => [
            c.id,
            c.nombre || '',
            c.dni_ruc || 'N/A',
            c.telefono || '',
            c.correo || 'N/A',
            c.direccion || 'N/A',
            c.estado_cuenta || '',
            new Date(c.fecha_registro).toLocaleString('es-PE')
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
