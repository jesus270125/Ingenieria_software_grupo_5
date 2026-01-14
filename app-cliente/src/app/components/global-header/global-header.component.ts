import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
// Carrito removed

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
    
      </ion-toolbar>
    </ion-header>
  `
})
export class GlobalHeaderComponent {
  constructor(private location: Location) {}

  back() {
    this.location.back();
  }
}
