import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private API = 'http://localhost:4000/productos';

  constructor(private http: HttpClient) {}

  listarPorLocal(localId: number) {
    return this.http.get<any[]>(`${this.API}/local/${localId}`);
  }

  crear(data: any) {
    return this.http.post(this.API, data);
  }

  editar(id: number, data: any) {
    return this.http.patch(`${this.API}/${id}`, data);
  }
}
