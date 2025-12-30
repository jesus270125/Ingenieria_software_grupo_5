import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html'

})
export class LoginComponent {

  correo = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.correo, this.password).subscribe((res: any) => {

      if (res.rol !== 'administrador') {
        alert("Acceso restringido a administradores");
        return;
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('rol', res.rol);

      this.router.navigate(['/admin']);

    }, () => alert("Credenciales inválidas"));
  }

}
