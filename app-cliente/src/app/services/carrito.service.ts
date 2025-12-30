import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  product: any;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private storageKey = 'carrito';
  private paymentKey = 'metodo_pago';

  private _items = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  readonly items$ = this._items.asObservable();

  constructor() {}

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]) {
    this._items.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  getItems(): CartItem[] {
    return this._items.getValue();
  }

  addProduct(product: any, quantity = 1) {
    const items = this.getItems();
    const idx = items.findIndex(i => i.product.id === product.id);
    if (idx >= 0) {
      items[idx].quantity += quantity;
    } else {
      items.push({ product, quantity });
    }
    this.saveToStorage(items);
  }

  updateQuantity(productId: any, quantity: number) {
    const items = this.getItems().map(i => ({ ...i }));
    const idx = items.findIndex(i => i.product.id === productId);
    if (idx >= 0) {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].quantity = quantity;
      }
      this.saveToStorage(items);
    }
  }

  removeProduct(productId: any) {
    const items = this.getItems().filter(i => i.product.id !== productId);
    this.saveToStorage(items);
  }

  clearCart() {
    this.saveToStorage([]);
    localStorage.removeItem(this.paymentKey);
  }

  getSubtotal(): number {
    return this.getItems().reduce((sum, it) => sum + (it.product.precio || it.product.price || 0) * it.quantity, 0);
  }

  // payment method handling
  setPaymentMethod(method: string) {
    localStorage.setItem(this.paymentKey, method);
  }

  getPaymentMethod(): string | null {
    return localStorage.getItem(this.paymentKey);
  }
}
