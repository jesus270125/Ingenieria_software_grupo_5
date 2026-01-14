import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, VentaDiaria, PedidoPorHora, RendimientoMotorizado, TiempoEntrega, ResumenGeneral } from '../../services/reportes.service';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.html',
    styleUrls: ['./reportes.css']
})
export class ReportesComponent implements OnInit {
    loading = false;

    // Filtros de fecha
    fechaInicio: string = '';
    fechaFin: string = '';

    // Datos de reportes
    resumen: ResumenGeneral | null = null;
    ventas: VentaDiaria[] = [];
    pedidosHora: PedidoPorHora[] = [];
    motorizados: RendimientoMotorizado[] = [];
    tiempos: TiempoEntrega[] = [];

    constructor(
        private reportesService: ReportesService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Establecer fechas por defecto (últimos 7 días)
        const hoy = new Date();
        const hace7Dias = new Date();
        hace7Dias.setDate(hoy.getDate() - 7);

        this.fechaFin = this.formatDate(hoy);
        this.fechaInicio = this.formatDate(hace7Dias);

        this.generarReportes();
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generarReportes() {
        if (!this.fechaInicio || !this.fechaFin) {
            alert('Debe seleccionar fechas de inicio y fin');
            return;
        }

        if (this.fechaInicio > this.fechaFin) {
            alert('La fecha de inicio debe ser menor a la fecha de fin');
            return;
        }

        this.loading = true;

        // Cargar todos los reportes
        Promise.all([
            this.cargarResumen(),
            this.cargarVentas(),
            this.cargarPedidosHora(),
            this.cargarMotorizados(),
            this.cargarTiempos()
        ]).then(() => {
            this.loading = false;
            this.cdr.detectChanges();
        }).catch(err => {
            console.error('Error al cargar reportes:', err);
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    cargarResumen(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.reportesService.getResumenGeneral(this.fechaInicio, this.fechaFin).subscribe({
                next: (data) => {
                    this.resumen = data;
                    resolve();
                },
                error: (err) => {
                    console.error('Error al cargar resumen:', err);
                    reject(err);
                }
            });
        });
    }

    cargarVentas(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.reportesService.getVentasPorPeriodo(this.fechaInicio, this.fechaFin).subscribe({
                next: (data) => {
                    this.ventas = data;
                    resolve();
                },
                error: (err) => {
                    console.error('Error al cargar ventas:', err);
                    reject(err);
                }
            });
        });
    }

    cargarPedidosHora(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.reportesService.getPedidosPorHora(this.fechaInicio, this.fechaFin).subscribe({
                next: (data) => {
                    this.pedidosHora = data;
                    resolve();
                },
                error: (err) => {
                    console.error('Error al cargar pedidos por hora:', err);
                    reject(err);
                }
            });
        });
    }

    cargarMotorizados(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.reportesService.getRendimientoMotorizados(this.fechaInicio, this.fechaFin).subscribe({
                next: (data) => {
                    this.motorizados = data;
                    resolve();
                },
                error: (err) => {
                    console.error('Error al cargar motorizados:', err);
                    reject(err);
                }
            });
        });
    }

    cargarTiempos(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.reportesService.getTiemposEntrega(this.fechaInicio, this.fechaFin).subscribe({
                next: (data) => {
                    this.tiempos = data;
                    resolve();
                },
                error: (err) => {
                    console.error('Error al cargar tiempos:', err);
                    reject(err);
                }
            });
        });
    }

    toNumber(value: any): number {
        if (typeof value === 'number') return value;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    exportarVentasCSV() {
        if (this.ventas.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = ['Fecha', 'Total Pedidos', 'Entregados', 'Cancelados', 'Ventas', 'Envíos', 'Subtotal'];
        const rows = this.ventas.map(v => [
            v.fecha,
            v.total_pedidos,
            v.pedidos_entregados,
            v.pedidos_cancelados,
            this.toNumber(v.total_ventas).toFixed(2),
            this.toNumber(v.total_envios).toFixed(2),
            this.toNumber(v.total_subtotal).toFixed(2)
        ]);

        this.descargarCSV(headers, rows, 'reporte_ventas');
    }

    exportarMotorizadosCSV() {
        if (this.motorizados.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = ['Motorizado', 'Placa', 'Total Entregas', 'Exitosas', 'Canceladas', 'Total Generado'];
        const rows = this.motorizados.map(m => [
            m.motorizado_nombre,
            m.placa,
            m.total_entregas,
            m.entregas_exitosas,
            m.entregas_canceladas,
            this.toNumber(m.total_generado).toFixed(2)
        ]);

        this.descargarCSV(headers, rows, 'reporte_motorizados');
    }

    exportarTiemposCSV() {
        if (this.tiempos.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = ['Fecha', 'Pedidos Entregados', 'Tiempo Promedio (min)'];
        const rows = this.tiempos.map(t => [
            t.fecha,
            t.pedidos_entregados,
            this.toNumber(t.tiempo_promedio_minutos).toFixed(2)
        ]);

        this.descargarCSV(headers, rows, 'reporte_tiempos');
    }

    descargarCSV(headers: string[], rows: any[][], filename: string) {
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getPromedioTiempoEntrega(): number {
        if (this.tiempos.length === 0) return 0;
        const total = this.tiempos.reduce((sum, t) => sum + this.toNumber(t.tiempo_promedio_minutos), 0);
        return total / this.tiempos.length;
    }

    getMaxPedidosHora(): number {
        if (this.pedidosHora.length === 0) return 1;
        return Math.max(...this.pedidosHora.map(ph => ph.cantidad_pedidos));
    }
}
