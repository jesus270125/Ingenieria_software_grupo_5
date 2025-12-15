import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProductosPage implements OnInit {

  productos: any[] = [];
  localId!: number;
  localNombre!: string;

  constructor(
    private api: ProductosService,
    private router: Router
  ) {
    const data = history.state;

    if (data && data.localId) {
      this.localId = data.localId;
      this.localNombre = data.nombre;
    }
  }

  ngOnInit() {
    if (this.localId) {
      this.api.listarPorLocal(this.localId).subscribe(res => {
        this.productos = res;
      });
    }
  }

  crear() {
    this.router.navigate(['/admin/crear-producto'], { 
      state: { localId: this.localId }
    });
  }

  editar(producto: any) {
    this.router.navigate(['/admin/editar-producto', producto.id], { 
      state: { ...producto, localId: this.localId }
    });
  }
}
