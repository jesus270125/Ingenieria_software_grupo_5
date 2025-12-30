
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {
    credentials = { correo: '', password: '' };
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() { }

    login() {
        this.authService.login(this.credentials).subscribe({
            next: () => {
                this.router.navigate(['/home']);
            },
            error: (err) => {
                console.error('Login failed', err);
                // Handle error (alert/toast) - omitted for brevity but recommended
                alert('Credenciales incorrectas');
            }
        });
    }
}
