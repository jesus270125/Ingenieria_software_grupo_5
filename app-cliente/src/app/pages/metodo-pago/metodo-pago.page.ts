import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-metodo-pago',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './metodo-pago.page.html',
  styleUrls: ['./metodo-pago.page.scss']
})
export class MetodoPagoPage {
  metodo = '';

  constructor(private carrito: CarritoService, private router: Router) {
    this.metodo = this.carrito.getPaymentMethod() || '';
  }

  seleccionar() {
    if (!this.metodo) {
      alert('Selecciona un método de pago');
      return;
    }
    this.carrito.setPaymentMethod(this.metodo);
    this.router.navigate(['/confirmacion']);
  }
}
