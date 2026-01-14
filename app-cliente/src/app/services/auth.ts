import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(correo: string, password: string) {
    return this.http.post(`${this.api}/auth/login`, { correo, password });
  }

  register(data: any) {
    return this.http.post(`${this.api}/auth/register`, data);
  }

  getUser() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  }

  saveUser(user: any) {
    localStorage.setItem('usuario', JSON.stringify(user));
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  }

  getProfile() {
    return this.http.get(`${this.api}/auth/profile`);
  }

  updateProfile(data: any) {
    return this.http.put(`${this.api}/auth/profile`, data);
  }
}
