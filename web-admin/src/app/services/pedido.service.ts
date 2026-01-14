import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Pedido {
    id: number;
    usuario_id: number;
    usuario_nombre: string;
    subtotal: number;
    envio: number;
    total: number;
    direccion: string;
    metodo_pago: string;
    estado: string;
    estado_pago: string;
    motorizado_id: number | null;
    motorizado_nombre: string | null;
    created_at: string;
}

export interface Motorizado {
    id: number;
    nombre: string;
    telefono: string;
    placa: string;
    disponible: boolean;
    estado_cuenta?: string; // añadido para suspensión
}

@Injectable({ providedIn: 'root' })
export class PedidoService {

    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Listar todos los pedidos (Admin)
    getAllPedidos(): Observable<Pedido[]> {
        return this.http.get<Pedido[]>(`${this.api}/orders/admin/all`);
    }

    // Obtener detalle de un pedido
    getPedidoById(id: number): Observable<any> {
        return this.http.get(`${this.api}/orders/${id}`);
    }

    // RF-11: Reasignar pedido a otro motorizado
    reassignPedido(pedidoId: number, motorizadoId: number): Observable<any> {
        return this.http.put(`${this.api}/orders/admin/reassign`, {
            pedidoId,
            motorizadoId
        });
    }

    // Obtener lista de motorizados disponibles
    getMotorizados(): Observable<Motorizado[]> {
        return this.http.get<Motorizado[]>(`${this.api}/motorizado/list`);
    }

    // Cambiar estado de motorizado (suspender/activar)
    cambiarEstadoMotorizado(id: number, estado: string): Observable<any> {
        return this.http.put(`${this.api}/motorizado/estado`, { id, estado });
    }
}
