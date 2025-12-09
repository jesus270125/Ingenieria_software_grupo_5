import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [FormsModule, NgFor],
  templateUrl: './busqueda.html',
  styleUrls: ['./busqueda.css']
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