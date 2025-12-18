import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-global-header',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="back()">
            <ion-icon name="arrow-back" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Rayo Delivery</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/carrito">
            <ion-icon name="cart" slot="icon-only"></ion-icon>
            <ion-badge *ngIf="(items$ | async)?.length" color="light">{{ (items$ | async)?.length }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `
})
export class GlobalHeaderComponent {
  items$ = this.carrito.items$;

  constructor(private location: Location, private carrito: CarritoService) {}

  back() {
    this.location.back();
  }
}
