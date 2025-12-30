
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, Observable, BehaviorSubject } from 'rxjs';
// import { Geolocation } from '@capacitor/geolocation'; // Uncomment if using Capacitor Geolocation
// Mocking Geolocation for simulation as per requirements + web support

@Injectable({
    providedIn: 'root'
})
export class UbicacionService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:4000/api/ubicacion';

    // Current location subject
    private ubicacionActualSubject = new BehaviorSubject<{ lat: number, lng: number } | null>(null);
    ubicacionActual$ = this.ubicacionActualSubject.asObservable();

    constructor() {
        this.iniciarSeguimiento();
    }

    getCurrentPosition(): Promise<{ lat: number, lng: number }> {
        // Return mock or real position
        return new Promise(resolve => {
            // Mock implementation
            const mockPos = { lat: -12.046374, lng: -77.042793 };
            this.ubicacionActualSubject.next(mockPos);
            resolve(mockPos);

            // Real implementation would be:
            // Geolocation.getCurrentPosition().then(pos => {
            //    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            // });
        });
    }

    private iniciarSeguimiento() {
        // Send location every 30 seconds (RF13)
        interval(30000).subscribe(() => {
            const pos = this.ubicacionActualSubject.value;
            if (pos) {
                this.enviarUbicacion(pos.lat, pos.lng).subscribe();
            }
        });
    }

    enviarUbicacion(lat: number, lng: number) {
        return this.http.post(`${this.apiUrl}/actualizar`, { lat, lng });
    }
}
