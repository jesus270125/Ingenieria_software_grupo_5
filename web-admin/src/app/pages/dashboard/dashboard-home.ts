import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService, DashboardStats, TopItem, ActividadReciente } from '../../services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css']
})
export class DashboardHomePage implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChild('pedidosChart') pedidosChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ventasChart') ventasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('estadosChart') estadosChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats = {
    pedidosHoy: 0,
    pedidosTotal: 0,
    ventasHoy: 0,
    ventasMes: 0,
    motorizadosActivos: 0,
    motorizadosTotal: 0,
    clientesNuevos: 0,
    clientesTotal: 0,
    pedidosPendientes: 0,
    pedidosEnCurso: 0,
    pedidosCompletados: 0,
    pedidosCancelados: 0
  };

  topProductos: TopItem[] = [];
  topLocales: TopItem[] = [];
  actividadReciente: ActividadReciente[] = [];

  private pedidosChart?: Chart;
  private ventasChart?: Chart;
  private estadosChart?: Chart;

  loading = true;

  ngOnInit() {
    this.loadDashboardData();
    // Actualizar cada 30 segundos
    setInterval(() => this.loadDashboardData(), 30000);
  }

  ngAfterViewInit() {
    setTimeout(() => this.initCharts(), 100);
  }

  loadDashboardData() {
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
        this.updateEstadosChartData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.getTopProductos(5).subscribe({
      next: (data) => {
        this.topProductos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar top productos:', err)
    });

    this.dashboardService.getTopLocales(5).subscribe({
      next: (data) => {
        this.topLocales = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar top locales:', err)
    });

    this.dashboardService.getActividadReciente(8).subscribe({
      next: (data) => {
        this.actividadReciente = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar actividad:', err)
    });

    // Actualizar gráficas que traen su propia data
    this.updateTrendCharts();
  }

  initCharts() {
    this.createPedidosChart();
    this.createVentasChart();
    this.createEstadosChart();
  }

  createPedidosChart() {
    if (!this.pedidosChartRef) return;

    const ctx = this.pedidosChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.pedidosChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Pedidos',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createVentasChart() {
    if (!this.ventasChartRef) return;

    const ctx = this.ventasChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.ventasChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Ventas (S/)',
          data: [],
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createEstadosChart() {
    if (!this.estadosChartRef) return;

    const ctx = this.estadosChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.estadosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Curso', 'Completados', 'Cancelados'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: [
            '#f59e0b',
            '#3b82f6',
            '#10b981',
            '#ef4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  updateTrendCharts() {
    this.dashboardService.getPedidosTendencia(7).subscribe({
      next: (data) => {
        if (this.pedidosChart) {
          this.pedidosChart.data.labels = data.labels;
          this.pedidosChart.data.datasets[0].data = data.data;
          this.pedidosChart.update();
        }
      }
    });

    this.dashboardService.getVentasTendencia(7).subscribe({
      next: (data) => {
        if (this.ventasChart) {
          this.ventasChart.data.labels = data.labels;
          this.ventasChart.data.datasets[0].data = data.data;
          this.ventasChart.update();
        }
      }
    });
  }

  updateEstadosChartData() {
    if (this.estadosChart) {
      this.estadosChart.data.datasets[0].data = [
        this.stats.pedidosPendientes,
        this.stats.pedidosEnCurso,
        this.stats.pedidosCompletados,
        this.stats.pedidosCancelados
      ];
      this.estadosChart.update();
    }
  }

  getEstadoClass(estado?: string): string {
    switch (estado) {
      case 'completado': return 'badge-success';
      case 'en_curso': return 'badge-info';
      case 'pendiente': return 'badge-warning';
      case 'cancelado': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
