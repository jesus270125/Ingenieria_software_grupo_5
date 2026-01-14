
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { addIcons } from 'ionicons';
import { 
    storefrontOutline, 
    personCircleOutline, 
    personOutline, 
    locationOutline, 
    callOutline, 
    fastFoodOutline, 
    mapOutline, 
    bicycleOutline, 
    checkmarkCircleOutline, 
    keypadOutline,
    restaurantOutline
} from 'ionicons/icons';

@Component({
    selector: 'app-pedido',
    templateUrl: './pedido.page.html',
    styleUrls: ['./pedido.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class PedidoPage implements OnInit {
    pedido: Pedido | null = null;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private pedidoService = inject(PedidoService);
    private alertController = inject(AlertController);

    constructor() {
        addIcons({
            storefrontOutline,
            personCircleOutline,
            personOutline,
            locationOutline,
            callOutline,
            fastFoodOutline,
            mapOutline,
            bicycleOutline,
            checkmarkCircleOutline,
            keypadOutline,
            restaurantOutline
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.pedidoService.getPedido(+id).subscribe(p => this.pedido = p);
        }
    }

    cambiarEstado(nuevoEstado: string) {
        if (!this.pedido) return;
        this.pedidoService.updateEstado(this.pedido.id, nuevoEstado).subscribe({
            next: (response: any) => {
                if (this.pedido) this.pedido.estado = nuevoEstado as any;
                
                // Si se generó código de entrega, mostrar notificación
                if (response.codigo_entrega) {
                    this.mostrarAlerta(
                        'Código de Entrega Generado',
                        'Se ha generado un código de entrega de 6 dígitos que ha sido enviado al cliente.<br><br><strong>Solicita al cliente que te proporcione el código para confirmar la entrega.</strong>'
                    );
                }
            },
            error: (err) => {
                console.error('Error al cambiar estado:', err);
                alert('Error al actualizar el estado del pedido');
            }
        });
    }

    async solicitarCodigoEntrega() {
        const alert = await this.alertController.create({
            header: 'Confirmar Entrega',
            message: 'Ingresa el código de 6 dígitos que te proporcionó el cliente:',
            inputs: [
                {
                    name: 'codigo',
                    type: 'number',
                    placeholder: 'Ejemplo: 123456',
                    attributes: {
                        maxlength: 6
                    }
                }
            ],
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Confirmar',
                    handler: (data) => {
                        if (!data.codigo || data.codigo.toString().length !== 6) {
                            this.mostrarAlerta('Error', 'Debes ingresar un código de 6 dígitos');
                            return false;
                        }
                        this.confirmarEntrega(data.codigo);
                        return true;
                    }
                }
            ]
        });

        await alert.present();
    }

    confirmarEntrega(codigo: string) {
        if (!this.pedido) return;
        
        this.pedidoService.confirmarEntrega(this.pedido.id, codigo).subscribe({
            next: (response: any) => {
                if (this.pedido) this.pedido.estado = 'entregado' as any;
                this.mostrarAlerta('¡Éxito!', response.mensaje || 'Pedido entregado correctamente');
                setTimeout(() => {
                    this.router.navigate(['/home']);
                }, 2000);
            },
            error: (err) => {
                console.error('Error al confirmar entrega:', err);
                const mensaje = err.error?.error || 'Código incorrecto o error al confirmar la entrega';
                this.mostrarAlerta('Error', mensaje);
            }
        });
    }

    async mostrarAlerta(header: string, message: string) {
        const alert = await this.alertController.create({
            header,
            message,
            buttons: ['OK']
        });
        await alert.present();
    }

    irAlMapa() {
        if (!this.pedido) return;

        const lat = this.pedido.lat_cliente;
        const lng = this.pedido.lng_cliente;

        // Si tenemos coordenadas del cliente, abrir Google Maps externo con ruta hacia ellas
        if (lat && lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

            // Intentar usar Capacitor Browser si está disponible (en móvil abre mejor navegador externo)
            try {
                // Import dinámico para evitar errores en entornos donde no esté instalado
                import('@capacitor/browser').then(m => {
                    if (m && m.Browser && typeof m.Browser.open === 'function') {
                        m.Browser.open({ url });
                    } else {
                        window.open(url, '_blank');
                    }
                }).catch(() => {
                    window.open(url, '_blank');
                });
            } catch (e) {
                window.open(url, '_blank');
            }

            return;
        }

        // Si faltan coordenadas, mostrar alerta
        alert('No se encontraron coordenadas del cliente para abrir la ruta.');
    }

    getEstadoClass(): string {
        if (!this.pedido) return 'default';
        const estado = this.pedido.estado?.toLowerCase() || '';
        
        if (estado === 'asignado') return 'asignado';
        if (estado.includes('camino') && estado.includes('restaurante')) return 'en-camino-restaurante';
        if (estado.includes('camino') && estado.includes('cliente')) return 'en-camino-cliente';
        if (estado.includes('entregado')) return 'entregado';
        
        return 'default';
    }

    getEstadoTexto(): string {
        if (!this.pedido) return 'Sin estado';
        const estado = this.pedido.estado || '';
        
        const estadosMap: any = {
            'asignado': 'Asignado',
            'en_camino_restaurante': 'En camino al restaurante',
            'en_camino_cliente': 'En camino al cliente',
            'entregado': 'Entregado'
        };
        
        return estadosMap[estado] || estado;
    }
}
