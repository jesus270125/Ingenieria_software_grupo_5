import { Component, OnInit, ViewEncapsulation, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProductosPage implements OnInit, OnDestroy {

  productos: any[] = [];
  localId!: number;
  localNombre!: string;
  cargando: boolean = true;
  querySub!: Subscription;

  constructor(
    private api: ProductosService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.querySub = this.route.queryParamMap.subscribe(() => {
      this.cargarProductos();
    });
  }

  cargarProductos() {
    this.cargando = true;
    this.localId = undefined as any;
    this.localNombre = '';
    const q = this.route.snapshot.queryParamMap.get('localId');
    const nombre = this.route.snapshot.queryParamMap.get('nombre');
    if (q) {
      this.localId = Number(q);
      if (nombre) this.localNombre = nombre;
    }
    this.productos = [];
    if (this.localId) {
      this.api.listarPorLocal(this.localId).subscribe({
        next: (res) => {
          this.productos = res;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.listar().subscribe({
        next: (res) => {
          this.productos = res;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.querySub) this.querySub.unsubscribe();
  }

  crear() {
    // Permitir crear producto desde la vista general o de local
    this.router.navigate(['/admin/crear-producto'], {
      state: this.localId ? { localId: this.localId } : undefined
    });
  }

  editar(producto: any) {
    // Permitir editar producto desde la vista general o de local
    this.router.navigate(['/admin/editar-producto', producto.id], {
      state: this.localId ? { ...producto, localId: this.localId } : producto
    });
  }
}
