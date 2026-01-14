import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    const apiKey = environment.googleMapsApiKey;
    if (!apiKey) {
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
