import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { IonicModule, IonInput } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

// 1. IMPORTAR HERRAMIENTAS DE ICONOS
import { addIcons } from 'ionicons';
import { personCircleOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements AfterViewInit {

  correo = '';
  password = '';

  // referencia al input de correo usando IonInput
  @ViewChild('correoInput', { static: false }) correoInput!: IonInput;

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ 
      personCircleOutline, 
      mailOutline, 
      lockClosedOutline 
    });
  }

  ngAfterViewInit() {
    // Mueve el foco al campo de correo al cargar la página
    setTimeout(() => {
      if (this.correoInput) {
        this.correoInput.setFocus();   // ✅ método oficial de Ionic
      }
    }, 200);
  }

  // 👇 cada vez que entras al login, limpia los campos
  ionViewWillEnter() {
    this.correo = '';
    this.password = '';
  }

  login() {
    if (!this.correo || !this.password) {
      alert("Por favor completa los campos");
      return;
    }

    this.auth.login(this.correo, this.password).subscribe({
      next: (res: any) => {
        if (res.rol !== 'cliente') {
          alert("Esta app es solo para clientes.");
          return;
        }

        localStorage.setItem('token', res.token);
        localStorage.setItem('rol', res.rol);

        // 👇 limpia también después de login
        this.correo = '';
        this.password = '';

        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);
        alert("Credenciales incorrectas o error de conexión");
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
}

