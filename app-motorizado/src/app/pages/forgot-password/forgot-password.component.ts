import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { lockOpenOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {

  step = 1; // 1: Enviar Correo, 2: Verificar Código y Cambiar Password

  email = '';
  codigo = '';
  newPassword = '';

  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {
    addIcons({ lockOpenOutline });
  }

  // Ajusta la URL base según tu entorno (o usa un servicio centralizado)
  private apiUrl = 'http://localhost:4000/api/auth';

  enviarCodigo() {
    if (!this.email) {
      alert("Ingresa tu correo");
      return;
    }

    this.isLoading = true;
    this.http.post(`${this.apiUrl}/recovery`, { correo: this.email }).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.step = 2; // Avanzar al paso 2
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.error || "Error al enviar código");
        this.isLoading = false;
      }
    });
  }

  cambiarPassword() {
    if (!this.codigo || !this.newPassword) {
      alert("Ingresa el código y la nueva contraseña");
      return;
    }

    this.isLoading = true;
    this.http.post(`${this.apiUrl}/reset-password`, {
      correo: this.email,
      codigo: this.codigo,
      nuevaPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        alert("Contraseña restablecida con éxito. Inicia sesión.");
        this.router.navigate(['/login']);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.error || "Error al restablecer contraseña");
        this.isLoading = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/login']);
  }
}
