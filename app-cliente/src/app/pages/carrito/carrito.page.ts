import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss']
})
export class CarritoPage {
  items$ = this.carrito.items$;

  constructor(private carrito: CarritoService, private router: Router) {}

  incrementar(item: any) {
    this.carrito.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrementar(item: any) {
    this.carrito.updateQuantity(item.product.id, item.quantity - 1);
  }

  eliminar(item: any) {
    this.carrito.removeProduct(item.product.id);
  }

  subtotal() {
    return this.carrito.getSubtotal();
  }

  elegirMetodo() {
    this.router.navigate(['/metodo-pago']);
  }
}
