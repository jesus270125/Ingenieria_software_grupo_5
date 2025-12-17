import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardHomePage {}
