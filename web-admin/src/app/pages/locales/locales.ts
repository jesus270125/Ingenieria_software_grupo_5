import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LocalesService } from '../../services/locales.service';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './locales.html',
  styleUrls: ['./locales.css']
})
export class LocalesPage implements OnInit {

  locales: any[] = [];

  constructor(private api: LocalesService, private router: Router) {}

  ngOnInit() {
    this.api.listar().subscribe(res => {
      this.locales = res;
    });
  }

  crear() {
    this.router.navigate(['/crear-local']);
  }

  editar(local: any) {
    this.router.navigate(['/editar-local', local.id], { state: local });
  }
}
