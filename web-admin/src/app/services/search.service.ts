import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private API = 'http://localhost:4000/api/buscar';

  constructor(private http: HttpClient) {}

  buscar(nombre?: string, categoria?: string) {
    let params: any = {};

    if (nombre) params.nombre = nombre;
    if (categoria) params.categoria = categoria;

    return this.http.get<any[]>(this.API, { params });
  }
}
