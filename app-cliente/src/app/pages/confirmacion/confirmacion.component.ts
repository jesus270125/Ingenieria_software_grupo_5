import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { DataService } from '../../services/data';
import { AuthService } from '../../services/auth';
import { PromocionService } from '../../services/promocion.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, locationOutline, cardOutline, checkmarkCircleOutline, closeCircleOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.component.html',
  styleUrls: ['./confirmacion.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class ConfirmacionComponent implements OnInit, AfterViewInit {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  map: any;
  marker: any;
  // ...existing code...

  initMap() {
    if (!navigator.geolocation) {
      this.mostrarToast('La geolocalización no está soportada en este navegador.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.selectedLat = position.coords.latitude;
        this.selectedLng = position.coords.longitude;
        if (this.map && this.marker) {
          this.map.setView([this.selectedLat, this.selectedLng], 16);
          this.marker.setLatLng([this.selectedLat, this.selectedLng]);
        }
        this.reverseGeocode(this.selectedLat, this.selectedLng);
        this.mostrarToast('Ubicación obtenida correctamente.', 'success');
      },
      (error) => {
        this.mostrarToast('No se pudo obtener la ubicación.', 'danger');
      }
    );
  }

  private async presentToast(message: string) {
    // Este método ya no se usa, eliminado para evitar duplicidad
  }

  items: any[] = [];
  usuario: any = null;
  metodoPago = '';
  // Simulated card fields
  cardNumber: string = '';
  cardExpiry: string = '';
  cardCvc: string = '';
  saveCard: boolean = false;
  subtotal = 0;
  envio = 5.00;
  descuento = 0;
  total = 0;
  direccion = '';
  selectedLat: number | null = null;
  selectedLng: number | null = null;
  
  // Códigos promocionales
  codigoPromo = '';
  promocionAplicada: any = null;
  validandoCodigo = false;
  // Yape data to show inline after order creation
  yapeData: { token: string; paymentUrl: string; phone?: string; qrUrl?: string } | null = null;
  yapePhone: string = '';
  qrPreviewUrl: string = '';
  pedidoInProcessId: any = null;

  constructor(
    private carritoService: CarritoService,
    private dataService: DataService,
    private authService: AuthService,
    private promocionService: PromocionService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
    
  ) {
    addIcons({ chevronBackOutline, locationOutline, cardOutline, checkmarkCircleOutline, closeCircleOutline, checkmarkCircle });
  }

  ngOnInit() {
    this.items = this.carritoService.getItems();
    this.metodoPago = this.carritoService.getPaymentMethod() || '';
    this.subtotal = this.carritoService.getSubtotal();
    this.total = this.subtotal + this.envio;

    // Obtener usuario del auth service (o localStorage)
    this.usuario = this.authService.getUser();
    if (this.usuario) {
      this.direccion = this.usuario.direccion || '';
      this.yapePhone = this.usuario.telefono || this.usuario.phone || this.yapePhone;
    }
    // default fallback phone
    if (!this.yapePhone) this.yapePhone = '962982413';

    // preparar preview de QR local para que se muestre inmediatamente
    if (this.metodoPago && this.metodoPago.toLowerCase().includes('yape')) {
      const deepLink = `yape://pay?phone=${encodeURIComponent(this.yapePhone)}&amount=${this.total}`;
      this.qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(deepLink)}&size=250x250`;
    }
  }

  async ngAfterViewInit() {
    setTimeout(() => this.initLeafletMap(), 200);
    try {
      this.tryGeolocation();
    } catch (err) {
      console.warn('Geolocation failed', err);
    }
  }

  initLeafletMap() {
    if (this.map) return;
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    
    // Configurar iconos de Leaflet para evitar error 404
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    
    this.map = L.map(mapDiv).setView([-12.0464, -77.0428], 15); // Lima por defecto
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.marker = L.marker([-12.0464, -77.0428], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', (e: any) => {
      const pos = this.marker.getLatLng();
      this.selectedLat = pos.lat;
      this.selectedLng = pos.lng;
      this.reverseGeocode(pos.lat, pos.lng);
    });
    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.selectedLat = lat;
      this.selectedLng = lng;
      this.marker.setLatLng([lat, lng]);
      this.reverseGeocode(lat, lng);
    });
    // Si ya hay coordenadas seleccionadas, centrar ahí
    if (this.selectedLat && this.selectedLng) {
      this.map.setView([this.selectedLat, this.selectedLng], 16);
      this.marker.setLatLng([this.selectedLat, this.selectedLng]);
    }
  }



  reverseGeocode(lat: number, lng: number) {
    // Use backend proxy to avoid CORS: /api/geocode/reverse?lat=...&lon=...
    try {
      // store selected coordinates
      this.selectedLat = lat;
      this.selectedLng = lng;
      const url = `${(window as any).__env?.apiUrl || 'http://localhost:4000'}/api/geocode/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      fetch(url).then(r => r.json()).then((data) => {
        if (data && data.display_name) this.direccion = data.display_name;
      }).catch(err => console.warn('reverse via backend failed', err));
    } catch (e) { console.warn(e); }
  }

  tryGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.selectedLat = pos.coords.latitude;
        this.selectedLng = pos.coords.longitude;
        this.reverseGeocode(this.selectedLat, this.selectedLng);
      }, (err) => {
        console.warn('Geolocation failed', err);
      }, { timeout: 5000 });
    }
  }

  async confirmarPedido() {
    if (!this.direccion) {
      this.mostrarToast('Por favor verifica tu dirección', 'warning');
      return;
    }

    // Verificar que existe usuario autenticado antes de acceder a usuario.id
    if (!this.usuario || !this.usuario.id) {
      await this.mostrarToast('Debes iniciar sesión para confirmar el pedido', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Procesando pedido...'
    });
    await loading.present();

    // If payment by card, validate card fields locally first
    if (this.metodoPago && this.metodoPago.toLowerCase().includes('tarjeta')) {
      const v = this.validateCardForm();
      if (!v.valid) {
        this.mostrarToast(v.message || 'Datos de tarjeta inválidos', 'warning');
        return;
      }
    }

    const orderPayload = {
      usuario_id: this.usuario.id,
      direccion: this.direccion,
      metodo_pago: this.metodoPago,
      subtotal: this.subtotal,
      envio: this.envio,
      total: this.total,
      latitude: this.selectedLat,
      longitude: this.selectedLng,
      local_id: this.carritoService.getCurrentLocalId(),
      items: this.items,
      codigo_promocional: this.promocionAplicada ? this.promocionAplicada.codigo : null,
      descuento: this.descuento
    };

    this.dataService.placeOrder(orderPayload).subscribe({
      next: async (res) => {
        // pedido creado
        const pedidoId = res && (res.id || res.insertId || res.orderId);
        await loading.dismiss();
        this.carritoService.clearCart();
        // store last created id so Generate button can reuse it
        this.pedidoInProcessId = pedidoId;

        // If card payment, simulate confirm after order creation
        if (this.metodoPago && this.metodoPago.toLowerCase().includes('tarjeta')) {
          // Optionally simulate saving a masked card alias locally
          if (this.saveCard) {
            try { localStorage.setItem('card_alias', this.maskCard(this.cardNumber)); localStorage.setItem('has_card', '1'); } catch (e) { /* ignore */ }
          }

          this.dataService.confirmFakePayment(pedidoId).subscribe({
            next: (r) => {
              this.mostrarToast('Pago con tarjeta (simulado) confirmado', 'success');
              this.router.navigate(['/historial'], { replaceUrl: true });
            },
            error: (err) => {
              console.error('confirm fake error', err);
              this.mostrarToast('No se pudo confirmar pago', 'danger');
              this.router.navigate(['/historial'], { replaceUrl: true });
            }
          });
          return;
        }

        // Si es Yape, solicitar link/QR y mostrar al usuario
        if (this.metodoPago && this.metodoPago.toLowerCase().includes('yape')) {
          const phone = this.usuario && (this.usuario.telefono || this.usuario.phone || this.usuario.telefono_usuario) ? (this.usuario.telefono || this.usuario.phone || this.usuario.telefono_usuario) : null;
          this.dataService.createYapeRequest({ orderId: pedidoId, amount: this.total, phone }).subscribe({
            next: async (r) => {
              // Show a modal-like alert with QR image and open link
                  // prepare inline Yape UI
                  const qrPayload = encodeURIComponent(r.qrData || r.paymentUrl || '');
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrPayload}`;
                  const phoneShown = r.phone || phone || '962982413';
                  this.yapeData = { token: r.token, paymentUrl: r.paymentUrl, phone: phoneShown, qrUrl };
            },
            error: (e) => {
              console.error('Yape init error', e);
              this.mostrarToast('Error creando solicitud Yape', 'danger');
              this.router.navigate(['/historial'], { replaceUrl: true });
            }
          });
          return;
        }

        // Si efectivo u otros, solo mostrar resultado
        this.mostrarToast('¡Pedido realizado con éxito!', 'success');
        this.router.navigate(['/historial'], { replaceUrl: true });
      },
      error: async (err) => {
        await loading.dismiss();
        console.error(err);
        this.mostrarToast('Error al procesar el pedido', 'danger');
      }
    });
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  validateCardForm(): { valid: boolean; message?: string } {
    const num = (this.cardNumber || '').replace(/\s+/g, '');
    if (!num || num.length < 12) return { valid: false, message: 'Número de tarjeta inválido' };
    if (!this.luhnCheck(num)) return { valid: false, message: 'Número de tarjeta no válido' };

    if (!this.cardExpiry || !/^[0-9]{2}\/[0-9]{2}$/.test(this.cardExpiry)) return { valid: false, message: 'Formato de expiración inválido (MM/AA)' };
    const parts = this.cardExpiry.split('/');
    const mm = parseInt(parts[0], 10);
    const yy = parseInt(parts[1], 10) + 2000;
    if (mm < 1 || mm > 12) return { valid: false, message: 'Mes de expiración inválido' };
    const expDate = new Date(yy, mm - 1, 1);
    const now = new Date();
    // set to last day of month
    expDate.setMonth(expDate.getMonth() + 1);
    if (expDate <= now) return { valid: false, message: 'Tarjeta vencida' };

    if (!this.cardCvc || !/^[0-9]{3,4}$/.test(this.cardCvc)) return { valid: false, message: 'CVC inválido' };

    return { valid: true };
  }

  luhnCheck(num: string) {
    let sum = 0;
    let alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num.charAt(i), 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return (sum % 10) === 0;
  }

  maskCard(num: string) {
    const s = (num || '').replace(/\s+/g, '');
    if (s.length < 4) return '****';
    return '**** **** **** ' + s.slice(-4);
  }

  openYape() {
    const url = (this.yapeData && this.yapeData.paymentUrl) ? this.yapeData.paymentUrl : `yape://pay?phone=${encodeURIComponent(this.yapePhone)}&amount=${this.total}`;
    window.open(url, '_blank');
  }

  async copyYapeInfo() {
    const phone = (this.yapeData && this.yapeData.phone) ? this.yapeData.phone : this.yapePhone || '962982413';
    const text = `${phone} ${this.total}`;
    try {
      await navigator.clipboard.writeText(text);
      this.mostrarToast('Número y monto copiados', 'success');
    } catch (e) {
      this.mostrarToast('No se pudo copiar automáticamente', 'warning');
    }
  }

  confirmYapePayment() {
    if (this.yapeData && this.yapeData.token) {
      this.dataService.confirmYape(this.yapeData.token).subscribe({
        next: (r) => { this.mostrarToast('Pago confirmado', 'success'); this.router.navigate(['/historial'], { replaceUrl: true }); },
        error: (err) => { console.error('confirm yape inline error', err); this.mostrarToast('No se pudo confirmar pago', 'danger'); }
      });
      return;
    }
    // fallback: if we have an order created, mark it paid (fake confirm)
    if (this.pedidoInProcessId) {
      this.dataService.confirmFakePayment(this.pedidoInProcessId).subscribe({
        next: () => { this.mostrarToast('Pago confirmado', 'success'); this.router.navigate(['/historial'], { replaceUrl: true }); },
        error: (err) => { console.error('confirm fake error', err); this.mostrarToast('No se pudo confirmar pago', 'danger'); }
      });
      return;
    }
    this.mostrarToast('Primero genera el QR o crea el pedido', 'warning');
  }

  // If user presses Generate QR manually: create order if not created and request yape
  async generateYapeAndShow(existingOrderId: any) {
    let orderId = existingOrderId;
    if (!orderId) {
      // create order first
      try {
        const payload = {
          usuario_id: this.usuario.id,
          direccion: this.direccion,
          metodo_pago: this.metodoPago,
          subtotal: this.subtotal,
          envio: this.envio,
          total: this.total,
          latitude: this.selectedLat,
          longitude: this.selectedLng,
          local_id: this.carritoService.getCurrentLocalId(),
          items: this.items
        };
        const res: any = await this.dataService.placeOrder(payload).toPromise();
        orderId = res && (res.id || res.insertId || res.orderId);
        this.pedidoInProcessId = orderId;
        this.carritoService.clearCart();
      } catch (e) {
        console.error('create order for yape error', e);
        this.mostrarToast('No se pudo crear pedido', 'danger');
        return;
      }
    }

    const phoneToUse = this.yapePhone || this.usuario?.telefono || '962982413';
    this.dataService.createYapeRequest({ orderId, amount: this.total, phone: phoneToUse }).subscribe({
      next: (r) => {
        const qrPayload = encodeURIComponent(r.qrData || r.paymentUrl || '');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrPayload}`;
        this.yapeData = { token: r.token, paymentUrl: r.paymentUrl, phone: phoneToUse, qrUrl };
      },
      error: (err) => {
        console.error('generate yape error', err);
        this.mostrarToast('No se pudo generar Yape', 'danger');
      }
    });
  }

  // Aplicar código promocional
  async aplicarCodigo() {
    if (!this.codigoPromo || !this.codigoPromo.trim()) {
      this.mostrarToast('Ingresa un código promocional', 'warning');
      return;
    }

    this.validandoCodigo = true;
    const montoSinDescuento = this.subtotal + this.envio;

    this.promocionService.validarCodigo(this.codigoPromo.trim(), montoSinDescuento).subscribe({
      next: (res) => {
        this.validandoCodigo = false;
        if (res.success) {
          this.promocionAplicada = res.promocion;
          this.descuento = res.descuento;
          this.recalcularTotal();
          this.mostrarToast(`¡Código aplicado! Descuento: S/ ${this.descuento.toFixed(2)}`, 'success');
        } else {
          this.mostrarToast(res.message || 'Código inválido', 'danger');
        }
      },
      error: (err) => {
        this.validandoCodigo = false;
        const mensaje = err.error?.message || 'Código no válido';
        this.mostrarToast(mensaje, 'danger');
      }
    });
  }

  // Quitar código promocional
  quitarCodigo() {
    this.promocionAplicada = null;
    this.descuento = 0;
    this.codigoPromo = '';
    this.recalcularTotal();
    this.mostrarToast('Código promocional removido', 'warning');
  }

  // Recalcular total
  private recalcularTotal() {
    this.total = this.subtotal + this.envio - this.descuento;
    if (this.total < 0) this.total = 0;

    // Actualizar QR de Yape si es el método de pago seleccionado
    if (this.metodoPago && this.metodoPago.toLowerCase().includes('yape')) {
      const deepLink = `yape://pay?phone=${encodeURIComponent(this.yapePhone)}&amount=${this.total}`;
      this.qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(deepLink)}&size=250x250`;
    }
  }
}
