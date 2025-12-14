import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LocalesService } from '../../services/locales';
import { addIcons } from 'ionicons'; // Agregado: Para registrar iconos
import { searchOutline, ellipse, ellipseOutline, chevronForward } from 'ionicons/icons'; // Agregado: Iconos específicos
import {
  IonLabel, IonToolbar, IonHeader, IonTitle, IonContent,
  IonSearchbar, IonChip, IonList, IonItem, IonThumbnail, IonSpinner,
  IonIcon // Agregado: Componente de icono
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
    IonSpinner,
    IonIcon // Agregado
  ]
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  filtrados: any[] = [];
  categorias: any[] = [];
  cargando = true;
  categoriaSeleccionada: string = 'TODOS'; // Agregado: Para controlar el chip activo (morado)

  constructor(
    private localesService: LocalesService,
    private router: Router
  ) {
    // Agregado: Registrar los iconos usados en el HTML
    addIcons({ searchOutline, ellipse, ellipseOutline, chevronForward });
  }

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
    const texto = event.target.value?.toLowerCase() || '';

    if (texto.trim() === '') {
      this.filtrados = [...this.locales];
      // Opcional: Si quieres mantener el filtro de categoría al limpiar búsqueda,
      // podrías llamar a this.filtrarCategoria(this.categoriaSeleccionada) aquí.
      return;
    }

    this.filtrados = this.locales.filter(l =>
      l.nombre.toLowerCase().includes(texto)
    );
  }

  filtrarCategoria(cat: string) {
    this.categoriaSeleccionada = cat; // Agregado: Actualizamos la selección visual

    if (cat === 'TODOS') {
      this.filtrados = [...this.locales];
      return;
    }

    this.filtrados = this.locales.filter(l => l.categoria === cat);
  }

  verLocal(id: number) {
    this.router.navigate(['/local', id]);
  }
}