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

        // Guardar token y usuario mediante AuthService
        try {
          this.auth.saveToken(res.token);
        } catch (e) {
          // fallback directo si saveToken no está disponible
          localStorage.setItem('token', res.token);
        }
        try {
          if (res.usuario) this.auth.saveUser(res.usuario);
        } catch (e) {
          localStorage.setItem('usuario', JSON.stringify(res.usuario || null));
        }
        localStorage.setItem('rol', res.rol);
        if (res.refreshToken) {
          localStorage.setItem('refresh_token', res.refreshToken);
        }

        // 👇 limpia también después de login
        this.correo = '';
        this.password = '';

        // Quitar foco del elemento activo antes de navegar para evitar warnings ARIA
        try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }

        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);
        alert("Credenciales incorrectas o error de conexión");
      }
    });
  }

  irARegistro() {
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }
    this.router.navigate(['/register']);
  }

  // Al salir de la vista, aseguramos que nada quede enfocado dentro de esta página
  ionViewWillLeave() {
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }
  }
}

