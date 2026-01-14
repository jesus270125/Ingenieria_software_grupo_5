
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:4000/api/auth'; // Adjust as needed
    private tokenKey = 'token';
    private userKey = 'usuario';
    private refreshKey = 'refresh_token';

    // Example state management
    private userSubject = new BehaviorSubject<any>(this.getUser());
    user$ = this.userSubject.asObservable(); // expose as observable

    http = inject(HttpClient);
    router = inject(Router);

    constructor() { }

    login(credentials: { correo: string; password: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                if (res.token) {
                    this.saveToken(res.token);
                    this.saveUser(res.usuario);
                }
                if (res.refreshToken) {
                    this.saveRefreshToken(res.refreshToken);
                }
            })
        );
    }

    register(data: any): Observable<any> {
        // Si el front envía FormData (para subir foto), Angular detecta automáticamente el multipart
        if (data instanceof FormData) {
            return this.http.post(`${this.apiUrl}/register`, data);
        }
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.refreshKey);
        this.userSubject.next(null);
        this.router.navigate(['/login']);
    }

    saveToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    saveUser(user: any) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.userSubject.next(user);
    }

    saveRefreshToken(token: string) {
        localStorage.setItem(this.refreshKey, token);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshKey);
    }

    getUser(): any {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getProfile(): Observable<any> {
        return this.http.get(`${this.apiUrl}/profile`);
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, data);
    }
}
