import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importamos RouterModule
import { AuthService } from '../../services/auth';

// 1. IMPORTAR HERRAMIENTAS DE ICONOS (Necesario para Ionic 7+)
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  cardOutline,
  locationOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule], // Agregamos RouterModule
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'] // ¡IMPORTANTE! Vincula el CSS morado aquí
})
export class RegisterPage {

  nombre = '';
  dni_ruc = '';
  direccion = '';
  correo = '';
  password = '';
  telefono = '';

  constructor(private auth: AuthService, private router: Router) {
    // 2. REGISTRAR ICONOS MANUALMENTE
    addIcons({
      personAddOutline,
      personOutline,
      mailOutline,
      callOutline,
      lockClosedOutline,
      cardOutline,
      locationOutline
    });
  }

  register() {
    // Validación rápida antes de enviar
    if (!this.nombre || !this.correo || !this.password || !this.telefono || !this.dni_ruc || !this.direccion) {
      alert("Por favor completa todos los campos (incluyendo DNI y Dirección).");
      return;
    }

    this.auth.register({
      nombre: this.nombre,
      dni_ruc: this.dni_ruc,
      direccion: this.direccion,
      correo: this.correo,
      password: this.password,
      telefono: this.telefono,
      rol: "cliente"  // Tu lógica original
    }).subscribe({
      next: () => {
        alert("Cuenta creada correctamente.");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        alert("Error al registrar.");
      }
    });
  }

  // 3. FUNCIÓN PARA EL BOTÓN "VOLVER"
  volverAlLogin() {
    this.router.navigate(['/login']);
  }

}