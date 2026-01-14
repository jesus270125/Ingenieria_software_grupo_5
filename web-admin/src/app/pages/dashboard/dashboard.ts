import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnDestroy {

  sidebarOpen = false;
  isDarkMode = false;
  private routerSub: Subscription;

  constructor(private router: Router) {
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarOpen = false;
    });

    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.setAttribute('data-theme', 'dark');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.routerSub.unsubscribe();
  }
}
