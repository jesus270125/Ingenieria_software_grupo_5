import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './seguimiento.page.html',
  styleUrls: ['./seguimiento.page.scss']
})
export class SeguimientoPage {
  pedido: any = null;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.pedido = nav && nav.extras && nav.extras.state ? nav.extras.state['pedido'] : null;
  }
}
