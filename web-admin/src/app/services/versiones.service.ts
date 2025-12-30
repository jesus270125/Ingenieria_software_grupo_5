import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VersionesService {

  private API = 'http://localhost:4000/api/versiones';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any[]>(this.API);
  }
}
