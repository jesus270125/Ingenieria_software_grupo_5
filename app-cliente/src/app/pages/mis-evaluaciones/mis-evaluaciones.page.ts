import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EvaluacionService, EvaluacionDetalle } from '../../services/evaluacion.service';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, 
  star,
  timeOutline, 
  chatboxOutline 
} from 'ionicons/icons';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonTitle,
  IonContent, 
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-mis-evaluaciones',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner
  ],
  templateUrl: './mis-evaluaciones.page.html',
  styleUrls: ['./mis-evaluaciones.page.scss']
})
export class MisEvaluacionesPage implements OnInit {
  evaluaciones: EvaluacionDetalle[] = [];
  isLoading = true;

  constructor(
    private evaluacionService: EvaluacionService,
    private router: Router
  ) {
    addIcons({chevronBackOutline, star, timeOutline, chatboxOutline});
  }

  ngOnInit(): void {
    this.cargarEvaluaciones();
  }

  cargarEvaluaciones() {
    this.isLoading = true;
    this.evaluacionService.getMisEvaluaciones().subscribe({
      next: (data) => {
        this.evaluaciones = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar evaluaciones:', err);
        this.isLoading = false;
      }
    });
  }

  getEstrellas(calificacion: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
