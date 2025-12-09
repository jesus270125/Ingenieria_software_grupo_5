import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalesService } from '../../services/locales.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form-local',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-local.html',
  styleUrls: ['./form-local.css']
})
export class FormLocalPage {

  modoEdicion = false;
  id: number | null = null;

  local = {
    nombre: '',
    direccion: '',
    categoria: '',
    imagen: '',
    hora_apertura: '',
    hora_cierre: ''
  };

  constructor(private api: LocalesService, private router: Router) {
    const data = history.state;
    if (data && data.id) {
      this.modoEdicion = true;
      this.id = data.id;
      this.local = data;
    }
  }

  guardar() {
    if (this.modoEdicion) {
      this.api.editar(this.id!, this.local).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    } else {
      this.api.crear(this.local).subscribe(() => {
        this.router.navigate(['/locales']);
      });
    }
  }
}
