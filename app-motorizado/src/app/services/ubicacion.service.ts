
import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
    private http = inject(HttpClient);
    private zone = inject(NgZone);
    private apiUrl = environment.apiUrl || 'http://localhost:4000/api/motorizado';

    // Socket (optional, for lower-latency updates)
    private socket: Socket | null = null;

    // Current location subject
    private ubicacionActualSubject = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
    ubicacionActual$ = this.ubicacionActualSubject.asObservable();

    private watchId: number | null = null;

    constructor() {
        this.connectSocket();
        this.iniciarSeguimiento();
    }

    // Subject to notify about pedido events
    private pedidoEventsSubject = new BehaviorSubject<any>(null);
    pedidoEvents$ = this.pedidoEventsSubject.asObservable();

    private connectSocket() {
        try {
            const socketUrl = environment.socketUrl || 'http://localhost:4000';
            const token = localStorage.getItem('token') || '';
            this.socket = io(socketUrl, { transports: ['websocket'], autoConnect: true, auth: { token: `Bearer ${token}` } });
            this.socket.on('connect', () => {
                console.log('Socket conectado', this.socket?.id);
            });
            this.socket.on('connect_error', (err: any) => {
                console.warn('Socket error', err);
            });

            // Listen for assignment events targeted to this motorizado
            this.socket.on('pedido:asignado', (data: any) => {
                try { this.zone.run(() => this.pedidoEventsSubject.next({ type: 'asignado', data })); } catch (_) { this.pedidoEventsSubject.next({ type: 'asignado', data }); }
            });
            this.socket.on('pedido:reasignado', (data: any) => {
                try { this.zone.run(() => this.pedidoEventsSubject.next({ type: 'reasignado', data })); } catch (_) { this.pedidoEventsSubject.next({ type: 'reasignado', data }); }
            });

        } catch (e) {
            console.warn('No se pudo inicializar socket:', e);
            this.socket = null;
        }
    }

    getCurrentPosition(): Promise<{ lat: number; lng: number }>
    {
        return new Promise((resolve, reject) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        this.ubicacionActualSubject.next(coords);
                        resolve(coords);
                    },
                    err => {
                        console.warn('Geolocation error, usando mock', err);
                        const mockPos = { lat: -12.046374, lng: -77.042793 };
                        this.ubicacionActualSubject.next(mockPos);
                        resolve(mockPos);
                    },
                    { enableHighAccuracy: true, maximumAge: 5000 }
                );
            } else {
                const mockPos = { lat: -12.046374, lng: -77.042793 };
                this.ubicacionActualSubject.next(mockPos);
                resolve(mockPos);
            }
        });
    }

    private iniciarSeguimiento() {
        if ('geolocation' in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                pos => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    // Run inside Angular zone to update UI safely
                    this.zone.run(() => this.ubicacionActualSubject.next(coords));
                    // Send to backend
                    this.enviarUbicacion(coords.lat, coords.lng).subscribe({ error: () => {} });
                    // Emit via socket for realtime clients
                    if (this.socket && this.socket.connected) {
                        this.socket.emit('motorizado_pos', { lat: coords.lat, lng: coords.lng });
                    }
                },
                err => {
                    console.warn('watchPosition error', err);
                },
                { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
            );
        } else {
            // Fallback: keep mock location
            const mockPos = { lat: -12.046374, lng: -77.042793 };
            this.ubicacionActualSubject.next(mockPos);
        }
    }

    enviarUbicacion(lat: number, lng: number) {
        return this.http.post(`${this.apiUrl}/actualizar`, { lat, lng });
    }

    stopWatching() {
        if (this.watchId !== null && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}
