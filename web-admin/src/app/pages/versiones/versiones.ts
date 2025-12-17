import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VersionesService } from '../../services/versiones.service';

@Component({
  selector: 'app-versiones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './versiones.html',
  styleUrls: ['./versiones.css'],
  encapsulation: ViewEncapsulation.None
})
export class VersionesPage implements OnInit {

  versiones: any[] = [];

  constructor(
    private api: VersionesService
  ) {}

  ngOnInit() {
    this.api.listar().subscribe(res => {
      this.versiones = res;
    });
  }
}
