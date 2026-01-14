import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Evaluacion {
  id?: number;
  pedido_id: number;
  motorizado_id: number;
  calificacion: number;
  comentario?: string;
}

export interface EvaluacionDetalle {
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
  motorizado_nombre?: string;
  motorizado_placa?: string;
  pedido_numero: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private apiUrl = 'http://localhost:4000/api/evaluaciones';

  constructor(private http: HttpClient) { }

  // RF-22: Crear evaluación
  crearEvaluacion(evaluacion: Evaluacion): Observable<any> {
    return this.http.post(this.apiUrl, evaluacion);
  }

  // RF-22: Verificar si puede evaluar un pedido
  puedeEvaluar(pedidoId: number): Observable<{ puedeEvaluar: boolean }> {
    return this.http.get<{ puedeEvaluar: boolean }>(`${this.apiUrl}/puede-evaluar/${pedidoId}`);
  }

  // RF-22: Obtener evaluaciones de un motorizado
  getEvaluacionesMotorizado(motorizadoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/motorizado/${motorizadoId}`);
  }

  // RF-22: Obtener mis evaluaciones (como cliente)
  getMisEvaluaciones(): Observable<EvaluacionDetalle[]> {
    return this.http.get<EvaluacionDetalle[]>(`${this.apiUrl}/mis-evaluaciones`);
  }
}
