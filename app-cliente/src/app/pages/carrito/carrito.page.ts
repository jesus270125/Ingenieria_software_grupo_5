import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Added RouterModule for routerLink
import { CarritoService } from '../../services/carrito.service';
import { addIcons } from 'ionicons';
import { trashOutline, trash, cartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss']
})
export class CarritoPage implements OnInit {
  items$ = this.carrito.items$;

  constructor(private carrito: CarritoService, private router: Router) {
    addIcons({ trashOutline, trash, cartOutline });
  }

  ngOnInit(): void {
    // Loguear emisiones para depuración
    this.items$.subscribe(items => {
      console.log('CarritoPage.items emission', items);
    });
  }

  incrementar(item: any) {
    this.carrito.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrementar(item: any) {
    this.carrito.updateQuantity(item.product.id, item.quantity - 1);
  }

  eliminar(item: any) {
    this.carrito.removeProduct(item.product.id);
  }

  eliminarTodo() {
    this.carrito.clearCart();
  }

  subtotal() {
    return this.carrito.getSubtotal();
  }



  elegirMetodo() {
    this.router.navigate(['/metodo-pago']);
  }
}
