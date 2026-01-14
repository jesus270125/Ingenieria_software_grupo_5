import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { addIcons } from 'ionicons';
import { cashOutline, cardOutline, phonePortraitOutline, chevronBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-metodo-pago',
  templateUrl: './metodo-pago.component.html',
  styleUrls: ['./metodo-pago.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MetodoPagoComponent implements OnInit {

  metodoSeleccionado = '';

  constructor(private carritoService: CarritoService, private router: Router) {
    addIcons({ cashOutline, cardOutline, phonePortraitOutline, chevronBackOutline });
  }

  ngOnInit() {
    // Ensure no payment method is auto-selected on open
    try { localStorage.removeItem('metodo_pago'); } catch (e) { /* ignore */ }
    this.metodoSeleccionado = '';
  }

  seleccionar(metodo: string) {
    this.metodoSeleccionado = metodo;
  }

  continuar() {
    if (this.metodoSeleccionado) {
      this.carritoService.setPaymentMethod(this.metodoSeleccionado);
      this.router.navigate(['/confirmacion']);
    }
  }
}
