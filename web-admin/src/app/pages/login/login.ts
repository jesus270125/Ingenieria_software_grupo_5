import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  correo = '';
  password = '';
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.auth.login(this.correo, this.password).subscribe({
      next: (res: any) => {
        // Backend returns token and usuario object
        const token = res.token;
        const rol = res.usuario ? res.usuario.rol : res.rol;

        if (rol !== 'administrador') {
          alert("Acceso restringido a administradores");
          this.isLoading = false;
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('rol', rol);
        if (res.refreshToken) {
          localStorage.setItem('refresh_token', res.refreshToken);
        }

        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        if (err.status === 401 || err.status === 400) {
          alert("Credenciales inválidas");
        } else {
          alert("Error de conexión con el servidor");
        }
      }
    });
  }

}