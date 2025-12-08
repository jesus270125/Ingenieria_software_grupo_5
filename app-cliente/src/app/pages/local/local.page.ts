import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LocalesService } from '../../services/locales';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSpinner
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-local',
  templateUrl: './local.page.html',
  styleUrls: ['./local.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonSpinner
  ]
})
export class LocalPage implements OnInit {

  localId!: number;
  local: any;
  productos: any[] = [];
  productosOriginales: any[] = [];
  cargando = true;

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
    this.localesService.getLocalById(this.localId).subscribe((resp: any) => {
      this.local = resp?.data;
    });
  }

  cargarProductos() {
    this.localesService.getProductosByLocal(this.localId).subscribe((resp: any) => {
      this.productos = resp?.data || [];
      this.productosOriginales = [...this.productos];
      this.cargando = false;
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
}
