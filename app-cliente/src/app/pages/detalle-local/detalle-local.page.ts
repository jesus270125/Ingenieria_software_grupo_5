import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-detalle-local',
  templateUrl: './detalle-local.page.html',
  styleUrls: ['./detalle-local.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DetalleLocalPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
