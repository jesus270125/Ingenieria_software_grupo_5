import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PromocionService {
  private apiUrl = 'http://localhost:4000/api/promociones';

  constructor(private http: HttpClient) {}

  // Obtener promociones activas
  getActivas(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/activas`, { headers });
  }

  // Validar código promocional
  validarCodigo(codigo: string, montoTotal: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/validar`, { codigo, montoTotal }, { headers });
  }
}
