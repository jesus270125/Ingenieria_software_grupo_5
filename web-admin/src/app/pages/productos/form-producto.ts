import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './form-producto.html',
  styleUrls: ['./form-producto.css'],
  encapsulation: ViewEncapsulation.None
})
export class FormProductoPage {

  modoEdicion = false;
  id: number | null = null;

  producto = {
    local_id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: ''
  };

  constructor(
    private api: ProductosService,
    private router: Router
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

  guardar() {
    if (this.modoEdicion) {
      this.api.editar(this.id!, this.producto).subscribe(() => {
        this.router.navigate(['/admin/productos'], {
          state: { localId: this.producto.local_id }
        });
      });
    } else {
      this.api.crear(this.producto).subscribe(() => {
        this.router.navigate(['/admin/productos'], {
          state: { localId: this.producto.local_id }
        });
      });
    }
  }
}
