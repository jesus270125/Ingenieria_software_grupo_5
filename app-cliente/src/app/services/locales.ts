import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocalesService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLocales() {
    return this.http.get(`${this.api}/locales`);
  }

  getLocalById(id: number) {
    return this.http.get(`${this.api}/locales/${id}`);
  }

  getProductosByLocal(id: number) {
    return this.http.get(`${this.api}/productos/local/${id}`);
  }

  buscar(query: string) {
    return this.http.get(`${this.api}/buscar?nombre=${query}`);
  }
}
