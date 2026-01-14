import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data';
import { addIcons } from 'ionicons';
import { searchOutline, star, timeOutline, locationOutline, chevronBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-locales',
  templateUrl: './locales.component.html',
  styleUrls: ['./locales.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LocalesComponent implements OnInit {

  locales: any[] = [];
  localesFiltrados: any[] = [];
  categorias: string[] = [];
  categoriaSeleccionada = 'Todos';
  textoBusqueda = '';

  isLoading = true;

  constructor(private dataService: DataService) {
    addIcons({ searchOutline, star, timeOutline, locationOutline, chevronBackOutline });
  }

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.dataService.getLocales().subscribe({
      next: (res) => {
        this.locales = res;
        this.localesFiltrados = res;
        this.extraerCategorias();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  extraerCategorias() {
    const cats = new Set(this.locales.map(l => l.categoria));
    this.categorias = ['Todos', ...Array.from(cats)];
  }

  filtrarPorCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
    this.aplicarFiltros();
  }

  buscar(event: any) {
    this.textoBusqueda = event.detail.value;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let filtrados = this.locales;

    // Filtro Categoría
    if (this.categoriaSeleccionada !== 'Todos') {
      filtrados = filtrados.filter(l => l.categoria === this.categoriaSeleccionada);
    }

    // Filtro Búsqueda (Nombre)
    if (this.textoBusqueda && this.textoBusqueda.trim() !== '') {
      const q = this.textoBusqueda.toLowerCase();
      filtrados = filtrados.filter(l => l.nombre.toLowerCase().includes(q));
    }

    this.localesFiltrados = filtrados;
  }
}
