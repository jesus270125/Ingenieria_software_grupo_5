
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pedido {
    id: number;
    cliente: string;
    direccion_cliente: string;
    restaurante: string;
    direccion_restaurante: string;
    estado: 'asignado' | 'en_camino_restaurante' | 'en_camino_cliente' | 'entregado';
    detalles: any[];
    total: number;
    lat_restaurante?: number;
    lng_restaurante?: number;
    lat_cliente?: number;
    lng_cliente?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PedidoService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:4000/api/pedidos';
    private motorizadoUrl = 'http://localhost:4000/api/motorizado';

    constructor() { }

    getPedidosAsignados(): Observable<Pedido[]> {
        return this.http.get<Pedido[]>(`${this.apiUrl}/asignados`); // Endpoint to list assigned orders
    }

    updateEstado(pedidoId: number, estado: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${pedidoId}/estado`, { estado });
    }

    cambiarDisponibilidad(disponible: boolean): Observable<any> {
        // RF21
        return this.http.put(`${this.motorizadoUrl}/disponibilidad`, { disponible });
    }

    getPedido(id: number): Observable<Pedido> {
        return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
    }
}
