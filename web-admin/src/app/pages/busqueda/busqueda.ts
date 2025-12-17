import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './busqueda.html',
  styleUrls: ['./busqueda.css'],
  encapsulation: ViewEncapsulation.None
})
export class BusquedaPage {

  nombre = '';
  categoria = '';
  resultados: any[] = [];

  constructor(private api: SearchService) {}

  buscar() {
    this.api.buscar(this.nombre, this.categoria).subscribe(res => {
      this.resultados = res;
    });
  }
}
