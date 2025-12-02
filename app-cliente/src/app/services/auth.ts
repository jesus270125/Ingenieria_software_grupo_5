import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(correo: string, password: string) {
    return this.http.post(`${this.api}/auth/login`, { correo, password });
  }

  register(data: any) {
    return this.http.post(`${this.api}/auth/register`, data);
  }

}
