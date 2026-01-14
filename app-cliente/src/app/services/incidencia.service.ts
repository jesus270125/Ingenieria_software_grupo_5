import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Incidencia {
  id?: number;
  pedido_id: number;
  usuario_id?: number;
  tipo_incidencia: 'demora' | 'mal_estado' | 'perdida' | 'otro';
  descripcion: string;
  foto_url?: string;
  estado?: 'pendiente' | 'en_revision' | 'resuelto';
  respuesta_admin?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface IncidenciaDetalle extends Incidencia {
  numero_pedido?: string;
  usuario_nombre?: string;
  usuario_correo?: string;
  motorizado_nombre?: string;
}

export interface EstadisticasIncidencias {
  total: number;
  pendientes: number;
  en_revision: number;
  resueltos: number;
  demoras: number;
  mal_estado: number;
  perdidas: number;
  otros: number;
}

@Injectable({
  providedIn: 'root'
})
export class IncidenciaService {
  private apiUrl = `${environment.apiUrl}/incidencias`;

  constructor(private http: HttpClient) {}

  // Crear una nueva incidencia con foto opcional
  crear(incidenciaData: Incidencia, foto?: File): Observable<any> {
    const formData = new FormData();
    formData.append('pedido_id', incidenciaData.pedido_id.toString());
    formData.append('tipo_incidencia', incidenciaData.tipo_incidencia);
    formData.append('descripcion', incidenciaData.descripcion);
    
    if (foto) {
      formData.append('foto', foto);
    }

    return this.http.post(this.apiUrl, formData);
  }

  // Obtener mis incidencias
  getMisIncidencias(): Observable<IncidenciaDetalle[]> {
    return this.http.get<IncidenciaDetalle[]>(`${this.apiUrl}/mis-incidencias`);
  }

  // Obtener incidencias por pedido
  getByPedido(pedidoId: number): Observable<IncidenciaDetalle[]> {
    return this.http.get<IncidenciaDetalle[]>(`${this.apiUrl}/pedido/${pedidoId}`);
  }

  // Obtener todas las incidencias (admin)
  getAll(): Observable<IncidenciaDetalle[]> {
    return this.http.get<IncidenciaDetalle[]>(this.apiUrl);
  }

  // Responder a una incidencia (admin)
  responder(id: number, respuesta: string, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/responder`, { respuesta, estado });
  }

  // Obtener estadísticas (admin)
  getEstadisticas(): Observable<EstadisticasIncidencias> {
    return this.http.get<EstadisticasIncidencias>(`${this.apiUrl}/estadisticas`);
  }
}
