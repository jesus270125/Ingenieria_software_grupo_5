import { Component, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarritoService } from '../../services/carrito.service';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cart-fab',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  template: `
    <ng-container *ngIf="visible">
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="goToCart()" color="primary" aria-label="Carrito">
          <ion-icon name="cart-outline" style="color: #fff; font-size: 20px;"></ion-icon>
          <ion-badge *ngIf="(items$ | async)?.length">{{ (items$ | async)?.length }}</ion-badge>
        </ion-fab-button>
      </ion-fab>
    </ng-container>
  `
})
export class CartFabComponent implements OnDestroy {
  items$ = this.carrito.items$;
  visible = true;
  sub: Subscription;

  constructor(private router: Router, private carrito: CarritoService) {
    // registrar icono cart-outline si no está registrado globalmente
    try { addIcons({ cartOutline }); } catch (e) { /* ignore */ }
    this.sub = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const url = e.urlAfterRedirects || e.url;
        // ocultar en login y register
        this.visible = !(url.startsWith('/login') || url.startsWith('/register'));
      }
    });
  }

  goToCart() {
    this.router.navigate(['/carrito']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
