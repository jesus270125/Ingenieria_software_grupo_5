import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LocalesService } from '../../services/locales';
import { addIcons } from 'ionicons';
import { searchOutline, ellipse, ellipseOutline, chevronForward } from 'ionicons/icons';
// Use IonicModule to provide Ionic components in this standalone page

@Component({
  selector: 'app-locales',
  templateUrl: './locales.page.html',
  styleUrls: ['./locales.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  filtrados: any[] = [];
  categorias: any[] = [];
  cargando = true;
  categoriaSeleccionada: string = 'TODOS';

  constructor(
    private localesService: LocalesService,
    private router: Router
  ) {
    addIcons({ searchOutline, ellipse, ellipseOutline, chevronForward });
  }

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.localesService.getLocales().subscribe((resp: any) => {

      // 🔥 Backend devuelve array directo
      // resp = [ {...}, {...} ]
      this.locales = Array.isArray(resp) ? resp : [];

      // Copia segura
      this.filtrados = [...this.locales];

      // Categorías únicas
      this.categorias = [...new Set(this.locales.map(l => l.categoria))];

      this.cargando = false;
    });
  }

  buscar(event: any) {
    const texto = event.target.value?.toLowerCase() || '';

    if (texto.trim() === '') {
      this.filtrados = [...this.locales];
      return;
    }

    this.filtrados = this.locales.filter(l =>
      l.nombre.toLowerCase().includes(texto)
    );
  }

  filtrarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;

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
