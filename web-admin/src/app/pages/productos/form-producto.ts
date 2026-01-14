import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { LocalesService } from '../../services/locales.service';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './form-producto.html',
  styleUrls: ['./form-producto.css']
})
export class FormProductoPage implements OnInit {

  modoEdicion = false;
  id: number | null = null;
  locales: any[] = [];
  formSubmitted = false;
  imagePreview: string | null = null;
  isImageLoading = false;

  producto = {
    local_id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: '',
    estado: 'activo' // Default activo
  };

  constructor(
    private api: ProductosService,
    private localesApi: LocalesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const data = history.state;

    if (data.localId) {
      this.producto.local_id = data.localId;
    }

    if (data && data.id) {
      this.modoEdicion = true;
      this.id = data.id;
      this.producto = data;
    }
  }

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.localesApi.listar().subscribe({
      next: (res) => {
        this.locales = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar locales:', err);
      }
    });
  }

  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isImageLoading = true;
      this.selectedFile = file;
      
      const reader = new FileReader();

      reader.onload = () => {
        setTimeout(() => {
          this.imagePreview = reader.result as string;
          this.isImageLoading = false;
          this.cdr.detectChanges();
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
    return `http://localhost:4000/uploads/${imageName}`;
  }

  guardar() {
    this.formSubmitted = true;

    // Validaciones
    if (!this.producto.local_id || !this.producto.nombre.trim() || !this.producto.precio || this.producto.precio <= 0) {
      alert('Por favor, complete todos los campos obligatorios (*) marcados en rojo antes de guardar.');
      return;
    }

    const formData = new FormData();
    formData.append('local_id', this.producto.local_id.toString());
    formData.append('nombre', this.producto.nombre);
    formData.append('descripcion', this.producto.descripcion);
    formData.append('precio', this.producto.precio.toString());
    formData.append('estado', this.producto.estado);

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    } else if (this.modoEdicion && this.producto.imagen) {
      // Misma lógica que en locales: no sobreescribir si no hay cambio
    }

    if (this.modoEdicion) {
      this.api.editar(this.id!, formData).subscribe(() => {
        this.router.navigate(['/admin/productos'], {
          state: { localId: this.producto.local_id }
        });
      });
    } else {
      this.api.crear(formData).subscribe(() => {
        this.router.navigate(['/admin/productos'], {
          state: { localId: this.producto.local_id }
        });
      });
    }
  }
}
