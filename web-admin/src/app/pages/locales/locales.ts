import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LocalesService } from '../../services/locales.service';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './locales.html',
  styleUrls: ['./locales.css'],
  encapsulation: ViewEncapsulation.None
})
export class LocalesPage implements OnInit {

  locales: any[] = [];
  cargando: boolean = true;

  constructor(
    private api: LocalesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarLocales();
  }

  cargarLocales() {
    this.cargando = true;

    this.api.listar().subscribe({
      next: (res) => {
        this.locales = res;
        this.cargando = false;
        this.cdr.detectChanges();   // ✅ ESTO SOLUCIONA EL PROBLEMA
      },
      error: (err) => {
        console.error('Error al cargar locales:', err);
        this.cargando = false;
      }
    });
  }

  crear() {
    this.router.navigate(['/admin/crear-local']);
  }

  editar(local: any) {
    this.router.navigate(['/admin/editar-local', local.id], { state: local });
  }
}
