import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
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
    this.api.listarPorLocal(this.localId).subscribe(res => {
      this.productos = res;
    });
  }

  crear() {
    this.router.navigate(['/crear-producto'], { 
      state: { localId: this.localId }
    });
  }

  editar(producto: any) {
    this.router.navigate(['/editar-producto', producto.id], { 
      state: { ...producto, localId: this.localId }
    });
  }
}