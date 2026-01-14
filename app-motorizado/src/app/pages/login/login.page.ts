
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { bicycleOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage {
    credentials = { correo: '', password: '' };
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        addIcons({ bicycleOutline, mailOutline, lockClosedOutline });
    }

    login() {
        this.authService.login(this.credentials).subscribe({
            next: (res: any) => {
                if (res.usuario && res.usuario.rol === 'motorizado') {
                    // El guardado del token ya se hace en el servicio auth.service.ts
                    this.router.navigate(['/home']);
                } else {
                    alert('Acceso exclusivo para motorizados.');
                    this.authService.logout(); // Limpiar por si acaso se guardó algo
                }
            },
            error: (err) => {
                console.error('Login failed', err);
                alert('Credenciales incorrectas o error de conexión');
            }
        });
    }
}
