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

  constructor(private http: HttpClient) { }

  listarPorLocal(localId: number) {
    // Usar la ruta de admin para ver todos (activos e inactivos)
    return this.http.get<any[]>(`${this.API}/admin/local/${localId}`);
  }

  listar() {
    return this.http.get<any[]>(this.API).pipe(
      catchError(err => {
        console.warn('Error fetching productos:', err);
        return of([] as any[]);
      })
    );
  }

  crear(data: FormData | any) {
    return this.http.post(this.API, data);
  }

  editar(id: number, data: FormData | any) {
    return this.http.patch(`${this.API}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.API}/${id}`);
  }
}
