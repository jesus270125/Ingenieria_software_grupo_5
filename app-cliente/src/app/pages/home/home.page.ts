import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // <-- 1. Agregado RouterModule
import { 
  IonContent, 
  IonButton, 
  IonGrid,  // <-- Nuevo
  IonRow,   // <-- Nuevo
  IonCol,   // <-- Nuevo
  IonIcon   // <-- Nuevo
} from '@ionic/angular/standalone';

// 2. IMPORTAR HERRAMIENTAS DE ICONOS
import { addIcons } from 'ionicons';
import { 
  storefrontOutline, 
  fastFoodOutline, 
  personOutline, 
  personCircle, 
  logOutOutline, 
  chevronForwardOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule, // <-- Importante para que routerLink funcione
    IonContent, 
    IonButton,
    IonGrid,      // <-- Agregados a los imports
    IonRow, 
    IonCol, 
    IonIcon
  ]
})
export class HomePage implements OnInit {

  constructor(private router: Router) { 
    // 3. REGISTRAR LOS ICONOS DEL DISEÑO
    addIcons({ 
      storefrontOutline, 
      fastFoodOutline, 
      personOutline, 
      personCircle, 
      logOutOutline, 
      chevronForwardOutline 
    });
  }

  ngOnInit() {}

  logout() {
    // Elimina token y datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    
    // Redirige al login
    this.router.navigateByUrl('/login');
  }
}