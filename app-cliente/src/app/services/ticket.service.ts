import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ticket {
  id?: number;
  usuario_id?: number;
  asunto: string;
  categoria: 'consulta' | 'problema_tecnico' | 'pedido' | 'pago' | 'cuenta' | 'otro';
  descripcion: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  estado?: string;
  respuesta_admin?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  asignado_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  crear(ticketData: Ticket): Observable<any> {
    return this.http.post(`${this.apiUrl}`, ticketData, { headers: this.getHeaders() });
  }

  obtenerMisTickets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-tickets`, { headers: this.getHeaders() });
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
