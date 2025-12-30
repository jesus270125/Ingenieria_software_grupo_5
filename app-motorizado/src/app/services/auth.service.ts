
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:4000/api/auth'; // Adjust as needed
    private tokenKey = 'token_motorizado';
    private userKey = 'user_motorizado';

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
            })
        );
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
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

    getUser(): any {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
