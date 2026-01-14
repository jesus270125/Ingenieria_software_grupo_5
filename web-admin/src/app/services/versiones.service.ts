import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionesService {

  private API = 'http://localhost:4000/api/versiones';

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.API);
  }

  // RF-30: Revertir a una versión anterior
  revertir(versionId: number): Observable<any> {
    return this.http.post(`${this.API}/revertir/${versionId}`, {});
  }
}
