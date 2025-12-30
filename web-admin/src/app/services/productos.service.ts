import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private API = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listarPorLocal(localId: number) {
    return this.http.get<any[]>(`${this.API}/local/${localId}`);
  }

  listar() {
    return this.http.get<any[]>(this.API).pipe(
      catchError(err => {
        console.warn('Error fetching productos:', err);
        return of([] as any[]);
      })
    );
  }

  crear(data: any) {
    return this.http.post(this.API, data);
  }

  editar(id: number, data: any) {
    return this.http.patch(`${this.API}/${id}`, data);
  }
}
