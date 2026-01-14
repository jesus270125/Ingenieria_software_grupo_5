import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './confirmacion.page.html',
  styleUrls: ['./confirmacion.page.scss']
})
export class ConfirmacionPage {
  constructor(private router: Router) {}

  confirmar() {
    alert('Funcionalidad de pedido deshabilitada');
    this.router.navigate(['/home']);
  }
}
