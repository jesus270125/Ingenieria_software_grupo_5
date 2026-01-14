import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  product: {
    id: string; // normalized as string
    nombre?: string;
    precio: number;
    imagen?: string;
    local_id?: string | null;
    [key: string]: any;
  };
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private storageKey = 'carrito';
  private localIdKey = 'cart_local_id';
  private paymentKey = 'metodo_pago';

  private currentLocalId: string | null = null;

  private _items = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this._items.asObservable();

  constructor() {
    // Cargar desde storage al iniciar
    const storedLocal = localStorage.getItem(this.localIdKey);
    this.currentLocalId = storedLocal ? JSON.parse(storedLocal) : null;
    const loaded = this.loadFromStorage();
    this._items.next(loaded);
    // Exponer instancia para depuración desde la consola: window.__carrito_debug__
    try { (window as any)['__carrito_debug__'] = this; } catch (e) { /* ignore */ }
  }

  private normalizeProduct(raw: any) {
    const id = raw?.id != null ? String(raw.id) : raw?._id != null ? String(raw._id) : null;
    const local_id = raw?.local_id != null ? String(raw.local_id) : raw?._local_id != null ? String(raw._local_id) : null;
    const precio = raw?.precio != null ? Number(raw.precio) : raw?.price != null ? Number(raw.price) : 0;
    return {
      id: id || '',
      nombre: raw?.nombre || raw?.name || '',
      precio: isNaN(precio) ? 0 : precio,
      imagen: raw?.imagen || raw?.image || null,
      local_id: local_id,
      // keep other fields if present
      ...raw
    };
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const normalized: CartItem[] = parsed.map((it: any) => {
        const prod = this.normalizeProduct(it.product || {});
        return {
          product: prod,
          quantity: Number(it.quantity) || 0
        };
      });
      return normalized.filter(i => i.product.id && i.quantity > 0);
    } catch (err) {
      console.error('CarritoService.loadFromStorage error', err);
      return [];
    }
  }

  private persist(items: CartItem[]) {
    try {
      const toStore = items.map(i => ({ product: i.product, quantity: i.quantity }));
      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
      localStorage.setItem(this.localIdKey, JSON.stringify(this.currentLocalId));
    } catch (err) {
      console.error('CarritoService.persist error', err);
    }
    this._items.next(items);
    try {
      console.log('CarritoService.persisted', { items, stored: JSON.parse(localStorage.getItem(this.storageKey) || '[]'), cart_local_id: JSON.parse(localStorage.getItem(this.localIdKey) || 'null') });
    } catch (e) { /* ignore parse errors */ }
  }

  getItems(): CartItem[] {
    return this._items.getValue();
  }

  // Return true if added, false if conflict (different local)
  addProduct(rawProduct: any, quantity = 1): boolean {
    if (!rawProduct) return false;
    const product = this.normalizeProduct(rawProduct);
    if (!product.id) return false;

    const items = this.getItems();
    console.log('CarritoService.addProduct incoming', { product, quantity, currentLocalId: this.currentLocalId, itemsBefore: items });

    // If cart has items, ensure same local
    if (items.length > 0 && this.currentLocalId && product.local_id && this.currentLocalId !== product.local_id) {
      return false; // conflict
    }

    // If first item, set local id
    if (items.length === 0) {
      this.currentLocalId = product.local_id || null;
    }

    const newItems = items.map(i => ({ product: i.product, quantity: i.quantity }));
    const idx = newItems.findIndex(i => String(i.product.id) === String(product.id));
    if (idx >= 0) {
      newItems[idx] = { product: newItems[idx].product, quantity: newItems[idx].quantity + quantity };
    } else {
      newItems.push({ product, quantity });
    }

    this.persist(newItems);
    console.log('CarritoService.addProduct result', { productId: product.id, itemsAfter: this.getItems(), cart_local_id: this.currentLocalId });
    try { (window as any)['__carrito_debug__'] = this; } catch (e) { /* ignore */ }
    return true;
  }

  updateQuantity(productId: string | number, quantity: number) {
    const items = this.getItems();
    const newItems = items.map(i => ({ product: i.product, quantity: i.quantity }));
    const idx = newItems.findIndex(i => String(i.product.id) === String(productId));
    if (idx >= 0) {
      if (quantity <= 0) {
        newItems.splice(idx, 1);
      } else {
        newItems[idx] = { product: newItems[idx].product, quantity };
      }
      // If removed last item, clear currentLocalId
      if (newItems.length === 0) this.currentLocalId = null;
      this.persist(newItems);
    }
  }

  removeProduct(productId: string | number) {
    const items = this.getItems();
    const newItems = items.filter(i => String(i.product.id) !== String(productId)).map(i => ({ product: i.product, quantity: i.quantity }));
    if (newItems.length === 0) this.currentLocalId = null;
    this.persist(newItems);
  }

  clearCart() {
    this.currentLocalId = null;
    try {
      localStorage.removeItem(this.paymentKey);
      localStorage.removeItem(this.localIdKey);
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.error('CarritoService.clearCart localStorage error:', err);
    }
    this._items.next([]);
  }

  getSubtotal(): number {
    return this.getItems().reduce((sum, it) => sum + (Number(it.product.precio || it.product['price'] || 0) * it.quantity), 0);
  }

  getCurrentLocalId() {
    return this.currentLocalId;
  }

  setPaymentMethod(method: string) {
    try { localStorage.setItem(this.paymentKey, method); } catch (e) { /* ignore */ }
  }

  getPaymentMethod(): string | null {
    return localStorage.getItem(this.paymentKey);
  }
}
