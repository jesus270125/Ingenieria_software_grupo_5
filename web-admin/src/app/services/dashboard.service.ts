import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  pedidosHoy: number;
  pedidosTotal: number;
  ventasHoy: number;
  ventasMes: number;
  motorizadosActivos: number;
  motorizadosTotal: number;
  clientesNuevos: number;
  clientesTotal: number;
  pedidosPendientes: number;
  pedidosEnCurso: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface TopItem {
  id: number;
  nombre: string;
  cantidad: number;
  total?: number;
}

export interface ActividadReciente {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getPedidosTendencia(dias: number = 7): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/dashboard/pedidos-tendencia?dias=${dias}`);
  }

  getVentasTendencia(dias: number = 7): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/dashboard/ventas-tendencia?dias=${dias}`);
  }

  getTopProductos(limit: number = 5): Observable<TopItem[]> {
    return this.http.get<TopItem[]>(`${this.apiUrl}/dashboard/top-productos?limit=${limit}`);
  }

  getTopLocales(limit: number = 5): Observable<TopItem[]> {
    return this.http.get<TopItem[]>(`${this.apiUrl}/dashboard/top-locales?limit=${limit}`);
  }

  getActividadReciente(limit: number = 10): Observable<ActividadReciente[]> {
    return this.http.get<ActividadReciente[]>(`${this.apiUrl}/dashboard/actividad?limit=${limit}`);
  }

  getEstadosPedidos(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/dashboard/estados-pedidos`);
  }
}
