import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons'; // Importante para registrar iconos
import { 
  notificationsOutline, 
  fastFoodOutline, 
  chevronForwardCircle, 
  receiptOutline, 
  personOutline, 
  logOutOutline 
} from 'ionicons/icons'; // Los iconos específicos que usamos en el HTML

import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, // Agregado
  IonButton,  // Agregado
  IonTitle, 
  IonContent, 
  IonIcon,    // Agregado
  IonRippleEffect // Agregado para el efecto al tocar las tarjetas
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class HomePage {
  constructor() {
    // Registramos los iconos para poder usarlos en el HTML por su nombre (string)
    addIcons({ 
      notificationsOutline, 
      fastFoodOutline, 
      chevronForwardCircle, 
      receiptOutline, 
      personOutline, 
      logOutOutline 
    });
  }
}