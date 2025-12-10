import { Component, ViewEncapsulation } from '@angular/core'; // 1. Importamos esto
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  // 2. 👇 ESTA LÍNEA ES OBLIGATORIA para que el CSS global funcione
  encapsulation: ViewEncapsulation.None 
})
export class DashboardComponent {

  sidebarOpen = false;

  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeMenu() {
    this.sidebarOpen = false;
  }
}