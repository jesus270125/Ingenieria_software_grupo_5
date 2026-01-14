import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  email = '';
  codigo = '';
  newPassword = '';
  step = 1;
  isLoading = false;

  private api = 'http://localhost:4000/api/auth';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  enviarCodigo() {
    if (!this.email) { 
      alert('Ingresa tu correo'); 
      return; 
    }
    this.isLoading = true;
    this.http.post(`${this.api}/recovery`, { correo: this.email }).subscribe({
      next: (res: any) => { 
        this.ngZone.run(() => {
          this.isLoading = false;
          setTimeout(() => {
            this.step = 2;
            this.cdr.markForCheck();
          }, 100);
        });
      },
      error: (err) => { 
        console.error(err);
        this.ngZone.run(() => {
          this.isLoading = false;
          alert(err.error?.error || 'Error al enviar código');
        });
      }
    });
  }

  cambiarPassword() {
    if (!this.codigo || !this.newPassword) { 
      alert('Ingresa código y nueva contraseña'); 
      return; 
    }
    this.isLoading = true;
    this.http.post(`${this.api}/reset-password`, { correo: this.email, codigo: this.codigo, nuevaPassword: this.newPassword }).subscribe({
      next: (res: any) => { 
        this.ngZone.run(() => {
          this.isLoading = false;
          alert('Contraseña restablecida exitosamente'); 
          this.router.navigate(['/login']);
        });
      },
      error: (err) => { 
        console.error(err);
        this.ngZone.run(() => {
          this.isLoading = false;
          alert(err.error?.error || 'Código inválido o expirado');
        });
      }
    });
  }
}
