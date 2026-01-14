import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IncidenciaService, IncidenciaDetalle } from '../../services/incidencia.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline,
  alertCircleOutline,
  timeOutline,
  chatboxOutline,
  checkmarkCircleOutline,
  imageOutline,
  refreshOutline
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
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ToastController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-mis-reportes',
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
    IonBadge,
    IonSpinner,
    IonRefresher,
    IonRefresherContent
  ],
  templateUrl: './mis-reportes.page.html',
  styleUrls: ['./mis-reportes.page.scss']
})
export class MisReportesPage implements OnInit, OnDestroy {
  incidencias: IncidenciaDetalle[] = [];
  isLoading = true;
  apiUrl = environment.apiUrl.replace('/api', '');
  private refreshInterval: any;

  constructor(
    private incidenciaService: IncidenciaService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      chevronBackOutline,
      alertCircleOutline,
      timeOutline,
      chatboxOutline,
      checkmarkCircleOutline,
      imageOutline,
      refreshOutline
    });
  }

  ngOnInit(): void {
    this.cargarIncidencias();
    // Actualizar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarIncidencias(true);
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarIncidencias(silencioso = false): void {
    if (!silencioso) {
      this.isLoading = true;
    }
    
    this.incidenciaService.getMisIncidencias().subscribe({
      next: async (data) => {
        const cantidadAnterior = this.incidencias.length;
        const nuevasRespuestas = data.filter(inc => 
          inc.respuesta_admin && !this.incidencias.find(old => 
            old.id === inc.id && old.respuesta_admin
          )
        ).length;

        this.incidencias = data;
        this.isLoading = false;

        // Notificar si hay nuevas respuestas
        if (silencioso && nuevasRespuestas > 0) {
          await this.mostrarNotificacion(
            `Tienes ${nuevasRespuestas} nueva${nuevasRespuestas > 1 ? 's' : ''} respuesta${nuevasRespuestas > 1 ? 's' : ''} del administrador`,
            'success'
          );
        }
      },
      error: async (err) => {
        console.error('Error al cargar incidencias:', err);
        this.isLoading = false;
        if (!silencioso) {
          await this.mostrarNotificacion('Error al cargar reportes', 'danger');
        }
      }
    });
  }

  async handleRefresh(event: any): Promise<void> {
    await this.cargarIncidencias(true);
    event.target.complete();
  }

  async mostrarNotificacion(mensaje: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  getTipoLabel(tipo: string): string {
    const tipos: any = {
      'demora': 'Demora en entrega',
      'mal_estado': 'Mal estado',
      'perdida': 'Pérdida',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'pendiente': 'warning',
      'en_revision': 'primary',
      'resuelto': 'success'
    };
    return colores[estado] || 'medium';
  }

  getEstadoLabel(estado: string): string {
    const labels: any = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'resuelto': 'Resuelto'
    };
    return labels[estado] || estado;
  }

  getFotoUrl(filename: string): string {
    return `${this.apiUrl}/uploads/${filename}`;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
