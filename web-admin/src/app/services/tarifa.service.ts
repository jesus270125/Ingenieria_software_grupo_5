import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalculoTarifa {
  tarifa: number;
  distanciaKm: number;
  detalles: {
    distancia: string;
    tarifaBase: number;
    radioEntrega: number;
    tarifaPorKm: number;
    kmExtra: string;
    cargoExtra: string;
  };
}

export interface ConfiguracionTarifas {
  tarifaBase: number;
  tarifaPorKm: number;
  radioEntrega: number;
  latLocal: number;
  lonLocal: number;
}

@Injectable({
  providedIn: 'root'
})
export class TarifaService {
  private apiUrl = 'http://localhost:4000/api/tarifas';

  constructor(private http: HttpClient) {}

  calcularTarifa(latOrigen: number, lonOrigen: number, latDestino: number, lonDestino: number): Observable<CalculoTarifa> {
    return this.http.post<CalculoTarifa>(`${this.apiUrl}/calcular`, {
      latOrigen,
      lonOrigen,
      latDestino,
      lonDestino
    });
  }

  getConfiguracion(): Observable<ConfiguracionTarifas> {
    return this.http.get<ConfiguracionTarifas>(`${this.apiUrl}/configuracion`);
  }
}
