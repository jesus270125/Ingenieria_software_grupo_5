import { Component, OnInit } from '@angular/core';
import { LocalesService } from '../../services/locales';
import { CommonModule } from '@angular/common';
import {
  IonLabel, IonToolbar, IonHeader, IonTitle, IonContent,
  IonSearchbar, IonChip, IonList, IonItem, IonThumbnail, IonSpinner
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-locales',
  templateUrl: './locales.page.html',
  styleUrls: ['./locales.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonSearchbar,
    IonChip,
    IonList,
    IonItem,
    IonThumbnail,
    IonSpinner
  ]
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  filtrados: any[] = [];
  categorias: any[] = [];
  cargando = true;

  constructor(private localesService: LocalesService) {}

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.localesService.getLocales().subscribe((resp: any) => {
      this.locales = resp.data;
      this.filtrados = [...this.locales];

      // Generar categorías únicas
      this.categorias = [...new Set(this.locales.map(l => l.categoria))];

      this.cargando = false;
    });
  }

  buscar(event: any) {
    const texto = event.target.value.toLowerCase();

    if (texto.trim() === '') {
      this.filtrados = [...this.locales];
      return;
    }

    this.filtrados = this.locales.filter(l =>
      l.nombre.toLowerCase().includes(texto)
    );
  }

  filtrarCategoria(cat: string) {
    if (cat === 'TODOS') {
      this.filtrados = [...this.locales];
      return;
    }

    this.filtrados = this.locales.filter(l => l.categoria === cat);
  }

  verLocal(id: number) {
    window.location.href = `/local/${id}`;
  }
}
