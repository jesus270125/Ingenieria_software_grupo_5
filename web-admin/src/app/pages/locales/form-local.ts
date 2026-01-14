import { Component, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalesService } from '../../services/locales.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-form-local',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './form-local.html',
  styleUrls: ['./form-local.css']
})
export class FormLocalPage {

  modoEdicion = false;
  id: number | null = null;
  formSubmitted = false;

  local = {
    nombre: '',
    direccion: '',
    categoria: '',
    imagen: '',
    hora_apertura: '',
    hora_cierre: ''
  };

  constructor(
    private api: LocalesService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const data = history.state;

    if (data && data.id) {
      this.modoEdicion = true;
      this.id = data.id;
      this.local = data;
    }
  }

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isImageLoading = false;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isImageLoading = true;
      this.selectedFile = file;
      
      const reader = new FileReader();

      reader.onload = () => {
        // Reducimos el tiempo y forzamos la detección de cambios para evitar que se quede "pegado"
        setTimeout(() => {
          this.imagePreview = reader.result as string;
          this.isImageLoading = false;
          this.cdr.detectChanges(); // Forzar actualización de la vista
        }, 500);
      };

      reader.onerror = () => {
        console.error("Error al leer la imagen");
        this.isImageLoading = false;
        this.cdr.detectChanges();
      };

      reader.readAsDataURL(file);
    }
  }

  clearImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getImageUrl(imageName: string): string {
    if (!imageName) return '';
    if (imageName.startsWith('http')) return imageName;
    // Asumimos que el backend sirve estáticos en /uploads/
    return `http://localhost:4000/uploads/${imageName}`;
  }

  guardar() {
    this.formSubmitted = true;
    
    // Validar campos obligatorios
    if (!this.local.nombre.trim() || !this.local.direccion.trim() || !this.local.categoria.trim() || !this.local.hora_apertura || !this.local.hora_cierre) {
      alert('Por favor, complete todos los campos obligatorios (*) marcados en rojo antes de guardar.');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.local.nombre);
    formData.append('direccion', this.local.direccion);
    formData.append('categoria', this.local.categoria);
    formData.append('hora_apertura', this.local.hora_apertura);
    formData.append('hora_cierre', this.local.hora_cierre);
    
    // Solo enviamos imagen si hay un archivo nuevo seleccionado
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    } else if (this.modoEdicion && this.local.imagen) {
      // En modo edición, si NO se cambió la imagen, enviamos el nombre actual
      // para que el backend lo preserve
      formData.append('imagen_actual', this.local.imagen);
    }

    if (this.modoEdicion) {
      this.api.editar(this.id!, formData).subscribe(() => {
        this.router.navigate(['/admin/locales']);
      });
    } else {
      this.api.crear(formData).subscribe(() => {
        this.router.navigate(['/admin/locales']);
      });
    }
  }
}
