import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
// Carrito removed
import { GoogleMapsLoaderService } from './services/google-maps-loader.service';
import { CartFabComponent } from './components/cart-fab/cart-fab.component';
import { Router, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [CommonModule, IonicModule, CartFabComponent],
})
export class AppComponent implements OnInit {
  constructor(private gmapsLoader: GoogleMapsLoaderService, private router: Router) {}

  ngOnInit(): void {
    this.gmapsLoader.load().catch(() => {
      // no hacemos nada si falla; errores se muestran en consola
    });

    // Al iniciar cualquier navegación, desenfocamos el elemento activo
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationStart) {
        try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }
      }
    });
  }
}
