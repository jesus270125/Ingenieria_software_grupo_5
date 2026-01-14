import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../services/data';
import { EvaluacionService } from '../../services/evaluacion.service';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronBackOutline, receiptOutline, timeOutline, cashOutline, bicycleOutline, starOutline, star } from 'ionicons/icons';

@Component({
  selector: 'app-pedido-detalle',
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class PedidoDetalleComponent implements OnInit {

  pedido: any = null;
  isLoading = true;
  
  // RF-22: Variables para evaluación
  puedeEvaluar = false;
  mostrarFormEvaluacion = false;
  calificacion = 0;
  comentario = '';
  enviandoEvaluacion = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private evaluacionService: EvaluacionService
  ) {
    addIcons({ chevronBackOutline, receiptOutline, timeOutline, cashOutline, bicycleOutline, starOutline, star });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPedido(+id);
    }
  }

  cargarPedido(id: number) {
    this.dataService.getOrderById(id).subscribe({
      next: (res) => {
        this.pedido = res;
        this.isLoading = false;
        
        // RF-22: Verificar si puede evaluar (solo si está entregado)
        if (this.pedido.estado === 'entregado' && this.pedido.motorizado_id) {
          this.verificarPuedeEvaluar(id);
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
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
