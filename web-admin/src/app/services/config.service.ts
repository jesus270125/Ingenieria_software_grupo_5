import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Configuracion {
    id: number;
    clave: string;
    valor: string;
    descripcion: string;
    tipo: 'numero' | 'texto' | 'boolean';
    actualizado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private api = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Configuracion[]> {
        return this.http.get<Configuracion[]>(`${this.api}/config`);
    }

    getByKey(clave: string): Observable<Configuracion> {
        return this.http.get<Configuracion>(`${this.api}/config/${clave}`);
    }

    update(clave: string, valor: string): Observable<any> {
        return this.http.put(`${this.api}/config/${clave}`, { valor });
    }

    updateMultiple(configuraciones: { clave: string, valor: string }[]): Observable<any> {
        return this.http.put(`${this.api}/config`, { configuraciones });
    }
}
