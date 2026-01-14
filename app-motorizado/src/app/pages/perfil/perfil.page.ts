import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  mailOutline, 
  callOutline, 
  locationOutline,
  chevronBackOutline,
  logOutOutline,
  createOutline,
  cardOutline,
  closeOutline,
  saveOutline,
  bicycleOutline,
  documentTextOutline
} from 'ionicons/icons';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule
  ],
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss']
})
export class PerfilPage implements OnInit {
  usuario: any = null;
  editandoNombre = false;
  editandoTelefono = false;
  editandoDireccion = false;
  nombreTemp = '';
  telefonoTemp = '';
  direccionTemp = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      chevronBackOutline,
      personOutline,
      cardOutline,
      mailOutline,
      callOutline,
      locationOutline,
      logOutOutline,
      createOutline,
      closeOutline,
      saveOutline,
      bicycleOutline,
      documentTextOutline
    });
  }

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.usuario = res;
        this.nombreTemp = res.nombre || '';
        this.telefonoTemp = res.telefono || '';
        this.direccionTemp = res.direccion || '';
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });
  }

  toggleEditNombre() {
    this.editandoNombre = !this.editandoNombre;
    if (!this.editandoNombre) {
      this.nombreTemp = this.usuario.nombre || '';
    }
  }

  toggleEditTelefono() {
    this.editandoTelefono = !this.editandoTelefono;
    if (!this.editandoTelefono) {
      this.telefonoTemp = this.usuario.telefono || '';
    }
  }

  toggleEditDireccion() {
    this.editandoDireccion = !this.editandoDireccion;
    if (!this.editandoDireccion) {
      this.direccionTemp = this.usuario.direccion || '';
    }
  }

  hayCambios(): boolean {
    return this.nombreTemp !== (this.usuario?.nombre || '') ||
           this.telefonoTemp !== (this.usuario?.telefono || '') || 
           this.direccionTemp !== (this.usuario?.direccion || '');
  }

  guardarCambios() {
    if (!this.hayCambios()) return;

    const datosActualizados: any = {};
    
    if (this.nombreTemp !== this.usuario.nombre) {
      datosActualizados.nombre = this.nombreTemp;
    }
    
    if (this.telefonoTemp !== this.usuario.telefono) {
      datosActualizados.telefono = this.telefonoTemp;
    }
    
    if (this.direccionTemp !== this.usuario.direccion) {
      datosActualizados.direccion = this.direccionTemp;
    }

    this.authService.updateProfile(datosActualizados).subscribe({
      next: () => {
        this.usuario.nombre = this.nombreTemp;
        this.usuario.telefono = this.telefonoTemp;
        this.usuario.direccion = this.direccionTemp;
        this.editandoNombre = false;
        this.editandoTelefono = false;
        this.editandoDireccion = false;
        alert('Perfil actualizado correctamente');
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        alert('Error al actualizar el perfil');
      }
    });
  }

  cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
