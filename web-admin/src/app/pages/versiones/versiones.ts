import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { VersionesService } from '../../services/versiones.service';

@Component({
  selector: 'app-versiones',
  standalone: true,
  imports: [NgFor],
  templateUrl: './versiones.html',
  styleUrls: ['./versiones.css']
})
export class VersionesPage implements OnInit {

  versiones: any[] = [];

  constructor(private api: VersionesService) {}

  ngOnInit() {
    this.api.listar().subscribe(res => {
      this.versiones = res;
    });
  }
}
