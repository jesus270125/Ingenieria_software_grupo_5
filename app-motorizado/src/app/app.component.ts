
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { GoogleMapsLoaderService } from './services/google-maps-loader.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent implements OnInit {
  constructor(private gmapsLoader: GoogleMapsLoaderService, private router: Router) {
    // Fix accesibilidad: quitar foco al navegar
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (document && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    });
  }

  ngOnInit(): void {
    this.gmapsLoader.load().catch(() => {
      // error se muestra en consola
    });
  }
}
