import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './confirmacion.page.html',
  styleUrls: ['./confirmacion.page.scss']
})
export class ConfirmacionPage {
  items = this.carrito.getItems();
  metodo = this.carrito.getPaymentMethod();

  constructor(private carrito: CarritoService, private pedido: PedidoService, private router: Router) {}

  subtotal() {
    return this.carrito.getSubtotal();
  }

  confirmar() {
    if (!this.metodo) {
      alert('Selecciona un método de pago');
      this.router.navigate(['/metodo-pago']);
      return;
    }

    const payload = {
      items: this.items.map(i => ({ productoId: i.product.id, cantidad: i.quantity })),
      subtotal: this.subtotal(),
      metodoPago: this.metodo
    };

    this.pedido.crearPedido(payload).subscribe({
      next: (res: any) => {
        this.carrito.clearCart();
        // redirigir a seguimiento como placeholder
        this.router.navigate(['/seguimiento'], { state: { pedido: res } });
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear el pedido');
      }
    });
  }
}
