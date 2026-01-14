import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { EvaluacionService } from '../../services/evaluacion.service';
import { addIcons } from 'ionicons';
import { starOutline, star, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './pedido-detalle.page.html',
  styleUrls: ['./pedido-detalle.page.scss']
})
export class PedidoDetallePage implements OnInit {
  pedido: any = null;
  
  // RF-22: Variables para evaluación
  puedeEvaluar = false;
  mostrarFormEvaluacion = false;
  calificacion = 0;
  comentario = '';
  enviandoEvaluacion = false;

  constructor(
    private route: ActivatedRoute, 
    private pedidoService: PedidoService,
    private evaluacionService: EvaluacionService
  ) {
    addIcons({ starOutline, star, alertCircleOutline });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pedidoService.getPedidoById(id).subscribe({
        next: (res: any) => {
          this.pedido = res || res.data || null;
          
          // RF-22: Verificar si puede evaluar (solo si está entregado)
          if (this.pedido && this.pedido.estado === 'entregado' && this.pedido.motorizado_id) {
            this.verificarPuedeEvaluar(this.pedido.id);
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  // RF-22: Verificar si puede evaluar
  verificarPuedeEvaluar(pedidoId: number) {
    this.evaluacionService.puedeEvaluar(pedidoId).subscribe({
      next: (res) => {
        this.puedeEvaluar = res.puedeEvaluar;
      },
      error: (err) => {
        console.error('Error al verificar evaluación:', err);
      }
    });
  }

  // RF-22: Mostrar formulario de evaluación
  abrirFormularioEvaluacion() {
    this.mostrarFormEvaluacion = true;
  }

  // RF-22: Seleccionar calificación
  seleccionarCalificacion(rating: number) {
    this.calificacion = rating;
  }

  // RF-22: Enviar evaluación
  enviarEvaluacion() {
    if (this.calificacion === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    this.enviandoEvaluacion = true;

    const evaluacion = {
      pedido_id: this.pedido.id,
      motorizado_id: this.pedido.motorizado_id,
      calificacion: this.calificacion,
      comentario: this.comentario
    };

    this.evaluacionService.crearEvaluacion(evaluacion).subscribe({
      next: () => {
        alert('¡Gracias por tu evaluación!');
        this.puedeEvaluar = false;
        this.mostrarFormEvaluacion = false;
        this.enviandoEvaluacion = false;
      },
      error: (err) => {
        console.error('Error al enviar evaluación:', err);
        alert('Error al enviar la evaluación. Inténtalo de nuevo.');
        this.enviandoEvaluacion = false;
      }
    });
  }

  // RF-22: Cancelar evaluación
  cancelarEvaluacion() {
    this.mostrarFormEvaluacion = false;
    this.calificacion = 0;
    this.comentario = '';
  }
}
