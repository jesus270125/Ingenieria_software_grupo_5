import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data';
import { CarritoService } from '../../services/carrito.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, star, timeOutline, addCircleOutline, cartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-detalle-local',
  templateUrl: './detalle-local.component.html',
  styleUrls: ['./detalle-local.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DetalleLocalComponent implements OnInit {

  local: any = null;
  productos: any[] = [];
  productosFiltrados: any[] = [];
  isLoading = true;
  textoBusqueda = '';
  localAbierto = true;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private carrito: CarritoService,
    private toastController: ToastController
  ) {
    addIcons({ chevronBackOutline, star, timeOutline, addCircleOutline, cartOutline });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(+id);
    }
  }

  cargarDatos(id: number) {
    this.isLoading = true;

    // Cargar info del local
    this.dataService.getLocalById(id).subscribe(local => {
      this.local = local;
      
      // RF-29: Verificar si el local está abierto
      this.verificarHorario();

      // Cargar productos
      this.dataService.getProductosPorLocal(id).subscribe(productos => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.isLoading = false;
      });
    });
  }

  verificarHorario() {
    if (!this.local) {
      this.localAbierto = false;
      return;
    }

    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const abierto = horaActual >= this.local.hora_apertura && horaActual <= this.local.hora_cierre;
    this.localAbierto = abierto;
  }

  buscarProducto(event: any) {
    const q = event.detail.value.toLowerCase();
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(q)
    );
  }

  async agregarAlCarrito(producto: any) {
    // RF-29: Verificar que el local esté abierto
    if (!this.localAbierto) {
      const toast = await this.toastController.create({
        message: `🔴 El local está cerrado. Horario: ${this.local.hora_apertura} - ${this.local.hora_cierre}`,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    console.log('Agregando al carrito:', producto);
    const added = this.carrito.addProduct({ ...producto, local_id: this.local?.id || producto.local_id }, 1);
    if (added) {
      const toast = await this.toastController.create({
        message: `✓ ${producto.nombre} agregado al carrito`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } else {
      const toast = await this.toastController.create({
        message: 'No se puede añadir: ya tienes artículos de otro local en el carrito',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
    }
  }
}
