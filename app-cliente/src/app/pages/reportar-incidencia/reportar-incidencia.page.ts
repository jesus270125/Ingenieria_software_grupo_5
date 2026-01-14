import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { IncidenciaService } from '../../services/incidencia.service';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline,
  alertCircleOutline,
  cameraOutline,
  closeCircleOutline
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
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-reportar-incidencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner
  ],
  templateUrl: './reportar-incidencia.page.html',
  styleUrls: ['./reportar-incidencia.page.scss']
})
export class ReportarIncidenciaPage implements OnInit {
  pedidoId: number = 0;
  numeroPedido: string = '';
  tipoIncidencia: 'demora' | 'mal_estado' | 'perdida' | 'otro' = 'demora';
  descripcion: string = '';
  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  enviando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incidenciaService: IncidenciaService
  ) {
    addIcons({chevronBackOutline, alertCircleOutline, cameraOutline, closeCircleOutline});
  }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('pedidoId');
    this.numeroPedido = this.route.snapshot.queryParamMap.get('numero') || '';
    
    if (id) {
      this.pedidoId = parseInt(id);
    } else {
      alert('No se especificó el pedido');
      this.router.navigate(['/historial']);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      this.fotoSeleccionada = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarFoto(): void {
    this.fotoSeleccionada = null;
    this.fotoPreview = null;
  }

  reportarIncidencia(): void {
    if (!this.tipoIncidencia || !this.descripcion.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.enviando = true;

    const incidenciaData = {
      pedido_id: this.pedidoId,
      tipo_incidencia: this.tipoIncidencia,
      descripcion: this.descripcion.trim()
    };

    this.incidenciaService.crear(incidenciaData, this.fotoSeleccionada || undefined).subscribe({
      next: (response) => {
        alert('Incidencia reportada exitosamente. Nuestro equipo la revisará pronto.');
        this.router.navigate(['/mis-reportes']);
      },
      error: (err) => {
        console.error('Error al reportar incidencia:', err);
        alert('Error al reportar la incidencia. Intenta nuevamente.');
        this.enviando = false;
      }
    });
  }

  goBack(): void {
    // Volver al detalle del pedido si existe el ID
    if (this.pedidoId) {
      this.router.navigate(['/pedido', this.pedidoId]);
    } else {
      this.router.navigate(['/historial']);
    }
  }
}
