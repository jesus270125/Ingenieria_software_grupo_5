import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;
  private storageKey = 'gmaps_api_key';

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    const apiKey = localStorage.getItem(this.storageKey) || environment.googleMapsApiKey;
    if (!apiKey) {
      // resolve but indicate maps not available
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }
      if (existing) {
        existing.remove();
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

  setApiKey(key: string) {
    try {
      if (!key) localStorage.removeItem(this.storageKey);
      else localStorage.setItem(this.storageKey, key);
    } catch (e) { /* ignore */ }
    // allow re-loading with new key
    this.loadPromise = null;
    const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
    if (existing) (existing as HTMLElement).remove();
  }
}
