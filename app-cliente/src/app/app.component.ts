import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CarritoService } from './services/carrito.service';
import { CartFabComponent } from './components/cart-fab/cart-fab.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [CommonModule, IonicModule, CartFabComponent],
})
export class AppComponent {
  items$ = this.carrito.items$;

  constructor(private carrito: CarritoService) {}
}
