
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { UbicacionService } from '../../services/ubicacion.service';
import { Subscription } from 'rxjs';

declare var google: any; // Assuming Google Maps JS is loaded or we use a wrapper

@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.page.html',
    styleUrls: ['./mapa.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class MapaPage implements OnInit, OnDestroy {
    @ViewChild('map', { static: true }) mapElement!: ElementRef;
    map: any;
    private motorizadoMarker: any = null;
    private directionsService: any = null;
    private directionsDisplay: any = null;
    private ubicSub: Subscription | null = null;

    private route = inject(ActivatedRoute);

    private ubicService = inject(UbicacionService);

    constructor() { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.loadMap(
                +params['latR'], +params['lngR'],
                +params['latC'], +params['lngC']
            );
        });

        // Subscribe to current position updates to update marker and ETA
        this.ubicSub = this.ubicService.ubicacionActual$.subscribe(pos => {
            if (!pos || !this.map) return;
            const latLngMot = new google.maps.LatLng(pos.lat, pos.lng);
            if (!this.motorizadoMarker) {
                this.motorizadoMarker = new google.maps.Marker({
                    position: latLngMot,
                    map: this.map,
                    title: 'Tu posición',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                });
            } else {
                this.motorizadoMarker.setPosition(latLngMot);
            }

            // Recalculate route from current position to cliente marker if directionsService configured
            if (this.directionsService && this.directionsDisplay && this.destinoLatLng) {
                this.directionsService.route({
                    origin: latLngMot,
                    destination: this.destinoLatLng,
                    travelMode: 'DRIVING'
                }, (response: any, status: string) => {
                    if (status === 'OK') {
                        this.directionsDisplay.setDirections(response);
                        // Optionally extract ETA: response.routes[0].legs[0].duration
                    }
                });
            }
        });
    }

    private origenLatLng: any = null;
    private destinoLatLng: any = null;

    loadMap(latR: number, lngR: number, latC: number, lngC: number) {
        // Basic simulation if Google Object not found (since we didn't add the script yet)
        if (typeof google === 'undefined') {
            console.warn('Google Maps SDK not loaded. Simulating map view.');
            return;
        }

        const latLngRestaurante = new google.maps.LatLng(latR || -12.0431800, lngR || -77.0282400);
        const latLngCliente = new google.maps.LatLng(latC || -12.046374, lngC || -77.042793);
        this.origenLatLng = latLngRestaurante;
        this.destinoLatLng = latLngCliente;

        const mapOptions = {
            center: latLngRestaurante,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

        // Markers
        new google.maps.Marker({
            position: latLngRestaurante,
            map: this.map,
            title: 'Restaurante',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        new google.maps.Marker({
            position: latLngCliente,
            map: this.map,
            title: 'Cliente',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        // Route (Polyline or DirectionsService)
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsDisplay.setMap(this.map);

        this.directionsService.route({
            origin: latLngRestaurante,
            destination: latLngCliente,
            travelMode: 'DRIVING'
        }, (response: any, status: string) => {
            if (status === 'OK') {
                this.directionsDisplay.setDirections(response);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.ubicSub) this.ubicSub.unsubscribe();
    }
}
