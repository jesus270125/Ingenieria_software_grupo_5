import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface VentaDiaria {
    fecha: string;
    total_pedidos: number;
    pedidos_entregados: number;
    pedidos_cancelados: number;
    total_ventas: number;
    total_envios: number;
    total_subtotal: number;
}

export interface PedidoPorHora {
    hora: number;
    cantidad_pedidos: number;
    promedio_venta: number;
}

export interface RendimientoMotorizado {
    motorizado_id: number;
    motorizado_nombre: string;
    placa: string;
    total_entregas: number;
    entregas_exitosas: number;
    entregas_canceladas: number;
    total_generado: number;
}

export interface TiempoEntrega {
    fecha: string;
    pedidos_entregados: number;
    tiempo_promedio_minutos: number;
}

export interface ResumenGeneral {
    total_pedidos: number;
    pedidos_entregados: number;
    pedidos_cancelados: number;
    pedidos_activos: number;
    ventas_totales: number;
    ticket_promedio: number;
    clientes_unicos: number;
    motorizados_activos: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getVentasPorPeriodo(fechaInicio: string, fechaFin: string): Observable<VentaDiaria[]> {
        return this.http.get<VentaDiaria[]>(`${this.api}/reportes/ventas`, {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
    }

    getPedidosPorHora(fechaInicio: string, fechaFin: string): Observable<PedidoPorHora[]> {
        return this.http.get<PedidoPorHora[]>(`${this.api}/reportes/pedidos-hora`, {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
    }

    getRendimientoMotorizados(fechaInicio: string, fechaFin: string): Observable<RendimientoMotorizado[]> {
        return this.http.get<RendimientoMotorizado[]>(`${this.api}/reportes/motorizados`, {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
    }

    getTiemposEntrega(fechaInicio: string, fechaFin: string): Observable<TiempoEntrega[]> {
        return this.http.get<TiempoEntrega[]>(`${this.api}/reportes/tiempos-entrega`, {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
    }

    getResumenGeneral(fechaInicio: string, fechaFin: string): Observable<ResumenGeneral> {
        return this.http.get<ResumenGeneral>(`${this.api}/reportes/resumen`, {
            params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
    }
}
