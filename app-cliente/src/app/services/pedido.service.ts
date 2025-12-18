import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  crearPedido(payload: any) {
    return this.http.post(`${this.api}/pedidos`, payload);
  }

  getPedidos() {
    return this.http.get(`${this.api}/pedidos/mis`);
  }

  getPedidoById(id: any) {
    return this.http.get(`${this.api}/pedidos/${id}`);
  }
}
