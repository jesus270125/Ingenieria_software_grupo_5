import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocalesService {

  private API = 'http://localhost:4000/locales';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any[]>(this.API);
  }

  crear(data: any) {
    return this.http.post(this.API, data);
  }

  editar(id: number, data: any) {
    return this.http.patch(`${this.API}/${id}`, data);
  }
}
