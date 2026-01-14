import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-metodo-pago',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './metodo-pago.page.html',
  styleUrls: ['./metodo-pago.page.scss']
})
export class MetodoPagoPage {
  metodo = '';

  constructor(private router: Router) {
    // Payment method selection disabled after cart removal
  }

  seleccionar() {
    alert('Funcionalidad de pago deshabilitada');
  }
}
