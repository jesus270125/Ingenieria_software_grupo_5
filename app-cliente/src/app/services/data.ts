import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }

  getLocales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/locales`);
  }

  getLocalById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/locales/${id}`);
  }

  getProductosPorLocal(localId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos/local/${localId}`);
  }

  searchProductos(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos/search?q=${query}`);
  }

  placeOrder(order: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, order);
  }

  createStripeCheckout(payload: { orderId: any; amount: number; currency?: string; successUrl?: string; cancelUrl?: string; }) {
    return this.http.post<any>(`${this.apiUrl}/payments/stripe-checkout`, payload);
  }

  createYapeRequest(payload: { orderId: any; amount: number; phone?: string }) {
    return this.http.post<any>(`${this.apiUrl}/payments/yape/create`, payload);
  }

  confirmYape(token: string) {
    return this.http.post<any>(`${this.apiUrl}/payments/yape/confirm`, { token });
  }

  // Confirm a fake card payment (no card data sent to backend)
  confirmFakePayment(orderId: any) {
    return this.http.post<any>(`${this.apiUrl}/payments/fake/confirm`, { orderId });
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }
}
