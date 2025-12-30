
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

declare var google: any; // Assuming Google Maps JS is loaded or we use a wrapper

@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.page.html',
    styleUrls: ['./mapa.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class MapaPage implements OnInit {
    @ViewChild('map', { static: true }) mapElement!: ElementRef;
    map: any;

    private route = inject(ActivatedRoute);

    constructor() { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.loadMap(
                +params['latR'], +params['lngR'],
                +params['latC'], +params['lngC']
            );
        });
    }

    loadMap(latR: number, lngR: number, latC: number, lngC: number) {
        // Basic simulation if Google Object not found (since we didn't add the script yet)
        if (typeof google === 'undefined') {
            console.warn('Google Maps SDK not loaded. Simulating map view.');
            return;
        }

        const latLngRestaurante = new google.maps.LatLng(latR || -12.0431800, lngR || -77.0282400);
        const latLngCliente = new google.maps.LatLng(latC || -12.046374, lngC || -77.042793);

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
        const directionsService = new google.maps.DirectionsService();
        const directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(this.map);

        directionsService.route({
            origin: latLngRestaurante,
            destination: latLngCliente,
            travelMode: 'DRIVING'
        }, (response: any, status: string) => {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }
}
