import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Import CommonModule
// Asegúrate de importar tu AuthService. Ajusta la ruta si es necesario.
// Si tu AuthService está en src/app/services/auth.service.ts:
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {

  // Modelo de datos para Motorizado
  usuario = {
    nombre: '',
    dni_ruc: '',
    correo: '',
    password: '',
    telefono: '',
    direccion: '',
    placa: '',
    licencia: '',
    rol: 'motorizado'
  };

  selectedFile: File | null = null;

  constructor(private auth: AuthService, private router: Router) { }

  register() {
    // Validaciones basicas
    if (!this.usuario.nombre || !this.usuario.correo || !this.usuario.password ||
      !this.usuario.placa || !this.usuario.licencia) {
      alert("Por favor completa todos los campos obligatorios (incluyendo Correo, Placa y Licencia).");
      return;
    }

    // Preparar FormData para enviar archivo si existe
    const form = new FormData();
    form.append('nombre', this.usuario.nombre);
    form.append('dni_ruc', this.usuario.dni_ruc || '');
    form.append('correo', this.usuario.correo);
    form.append('password', this.usuario.password);
    form.append('telefono', this.usuario.telefono || '');
    form.append('direccion', this.usuario.direccion || '');
    form.append('placa', this.usuario.placa || '');
    form.append('licencia', this.usuario.licencia || '');
    form.append('rol', this.usuario.rol || 'motorizado');

    if (this.selectedFile) {
      form.append('foto', this.selectedFile, this.selectedFile.name);
    }

    // Llamada al servicio con FormData
    this.auth.register(form).subscribe({
      next: (res: any) => {
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.error || "Error al registrar motorizado.");
      }
    });
  }

  onFileSelected(event: any) {
    const file: File | null = event.target.files && event.target.files.length ? event.target.files[0] : null;
    if (file) {
      this.selectedFile = file;
    }
  }

  // Navegación
  irLogin() {
    this.router.navigate(['/login']);
  }
}
