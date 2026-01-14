import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Evaluacion {
  id: number;
  pedido_id: number;
  cliente_id: number;
  motorizado_id: number;
  calificacion: number;
  comentario: string;
  respuesta_admin?: string;
  accion_tomada?: string;
  fecha_evaluacion: string;
  fecha_respuesta?: string;
  cliente_nombre: string;
  motorizado_nombre: string;
  motorizado_placa: string;
  pedido_numero: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private apiUrl = 'http://localhost:4000/api/evaluaciones';

  constructor(private http: HttpClient) { }

  // RF-22: Obtener todas las evaluaciones (Admin)
  getAll(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(this.apiUrl);
  }

  // RF-22: Responder a una evaluación
  responder(id: number, respuesta: string, accion?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/responder`, { respuesta, accion });
  }

  // RF-22: Obtener evaluaciones de un motorizado
  getByMotorizado(motorizadoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/motorizado/${motorizadoId}`);
  }
}
