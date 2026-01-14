import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LocalesService } from '../../services/locales';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSpinner, IonButton, IonFab, IonFabButton, IonIcon, IonBadge, IonToast, IonRow, IonCol,
  IonButtons, IonBackButton
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-local',
  templateUrl: './local.page.html',
  styleUrls: ['./local.page.scss'],
  standalone: true,
  imports: [IonButton,
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
    IonBadge,
    IonToast,
    IonRow,
    IonCol,
    IonButtons,
    IonBackButton
  ]
})
export class LocalPage implements OnInit {

  localId!: number;
  local: any;
  productos: any[] = [];
  productosOriginales: any[] = [];
  cargando = true;
  errorMsg: string | null = null;
  // Carrito functionality removed
  showToast = false;
  toastMsg = '';

  constructor(
    private route: ActivatedRoute,
    private localesService: LocalesService
  ) {}

  ngOnInit() {
    this.localId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarLocal();
    this.cargarProductos();
  }

  cargarLocal() {
    this.localesService.getLocalById(this.localId).subscribe({
      next: (resp: any) => {
        // soportar wrapper { data: {...} }
        if (resp && resp.data) {
          this.local = resp.data;
        } else if (resp && typeof resp === 'object') {
          this.local = resp;
        } else {
          this.local = null;
        }
      },
      error: (err) => {
        console.error('Error cargando local', err);
        this.local = null;
        this.errorMsg = err?.message || 'Error al cargar el local';
      }
    });
  }

  cargarProductos() {
    this.localesService.getProductosByLocal(this.localId).subscribe({
      next: (resp: any) => {
        // aceptar tanto array directo como wrapper { data: [...] }
        if (Array.isArray(resp)) {
          this.productos = resp;
        } else if (resp && Array.isArray(resp.data)) {
          this.productos = resp.data;
        } else {
          this.productos = [];
        }

        this.productosOriginales = [...this.productos];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.productos = [];
        this.productosOriginales = [];
        this.cargando = false;
        this.errorMsg = err?.message || 'Error al cargar los productos';
      }
    });
  }

  buscarProducto(event: any) {
    const texto = event.target.value.toLowerCase();

    if (texto.trim() === '') {
      this.productos = [...this.productosOriginales];
      return;
    }

    this.productos = this.productosOriginales.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
  }

  // agregarProducto removed
}
