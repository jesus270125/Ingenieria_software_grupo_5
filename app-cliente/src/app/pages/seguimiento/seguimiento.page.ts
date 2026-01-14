import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './seguimiento.page.html',
  styleUrls: ['./seguimiento.page.scss']
})
export class SeguimientoPage implements OnInit, OnDestroy {
  pedido: any = null;
  socket: Socket | null = null;

  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  map: any;
  motorizadoMarker: any = null;
  directionsService: any = null;
  directionsDisplay: any = null;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.pedido = nav && nav.extras && nav.extras.state ? nav.extras.state['pedido'] : null;
  }

  ngOnInit(): void {
    // Initialize map (will wait for google)
    setTimeout(() => this.initMap(), 200);

    if (this.pedido && this.pedido.id) {
      const socketUrl = environment.socketUrl || 'http://localhost:4000';
      this.socket = io(socketUrl, { transports: ['websocket'], autoConnect: true });
      // Send join with token (the app should provide token via AuthService; for now read from localStorage)
      const token = localStorage.getItem('token') || '';
      this.socket.on('connect', () => {
        this.socket?.emit('join_pedido', { token: `Bearer ${token}`, pedidoId: this.pedido.id });
      });

      this.socket.on('ubicacion_actualizada', (data: any) => {
        this.onUbicacionActualizada(data);
      });
    }
  }

  initMap() {
    if (typeof google === 'undefined') return;

    // Center map at client location (if available) otherwise default
    const latC = this.pedido?.lat_cliente || -12.046374;
    const lngC = this.pedido?.lng_cliente || -77.042793;
    const latLngCliente = new google.maps.LatLng(latC, lngC);

    const mapOptions = { center: latLngCliente, zoom: 14, mapTypeId: google.maps.MapTypeId.ROADMAP };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    new google.maps.Marker({ position: latLngCliente, map: this.map, title: 'Tu ubicación', icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsDisplay = new google.maps.DirectionsRenderer();
    this.directionsDisplay.setMap(this.map);
  }



  onUbicacionActualizada(data: any) {
    if (!data || !this.map) return;
    const lat = data.lat; const lng = data.lng;

    // Google case
    if (typeof google !== 'undefined' && this.map instanceof google.maps.Map) {
      const latLngMot = new google.maps.LatLng(lat, lng);

      if (!this.motorizadoMarker) {
        this.motorizadoMarker = new google.maps.Marker({ position: latLngMot, map: this.map, title: 'Motorizado', icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' });
      } else {
        this.motorizadoMarker.setPosition(latLngMot);
      }

      // Recalculate route from motorizado to client to get ETA
      const latC = this.pedido?.lat_cliente || -12.046374;
      const lngC = this.pedido?.lng_cliente || -77.042793;
      const latLngCliente = new google.maps.LatLng(latC, lngC);

      if (this.directionsService && this.directionsDisplay) {
        this.directionsService.route({ origin: latLngMot, destination: latLngCliente, travelMode: 'DRIVING' }, (response: any, status: string) => {
          if (status === 'OK') {
            this.directionsDisplay.setDirections(response);
            const eta = response.routes[0].legs[0].duration.text;
            // Show ETA in simple alert or UI; for now console and simple DOM update
            console.log('ETA:', eta);
            const el = document.getElementById('eta');
            if (el) el.innerText = `ETA: ${eta}`;
          }
        });
      }

      return;
    }


  }



  ngOnDestroy(): void {
    if (this.socket) this.socket.disconnect();
  }
}
