import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Cliente {
    id: number;
    nombre: string;
    dni_ruc: string;
    telefono: string;
    direccion: string;
    correo: string;
    estado_cuenta: string;
    fecha_registro: string;
    lat?: number;
    lng?: number;
}

export interface EstadisticasCliente {
    total_pedidos: number;
    pedidos_completados: number;
    pedidos_cancelados: number;
    total_gastado: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    listarClientes(): Observable<Cliente[]> {
        return this.http.get<Cliente[]>(`${this.api}/clientes`);
    }

    getCliente(id: number): Observable<Cliente> {
        return this.http.get<Cliente>(`${this.api}/clientes/${id}`);
    }

    updateEstado(id: number, estado: string): Observable<any> {
        return this.http.patch(`${this.api}/clientes/${id}/estado`, { estado_cuenta: estado });
    }

    getEstadisticas(id: number): Observable<EstadisticasCliente> {
        return this.http.get<EstadisticasCliente>(`${this.api}/clientes/${id}/estadisticas`);
    }
}
