import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

interface Backup {
  fileName: string;
  size: string;
  fecha: string;
}

interface BackupLog {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
}

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './backups.html',
  styleUrl: './backups.css'
})
export class BackupsPage implements OnInit {
  backups: Backup[] = [];
  history: BackupLog[] = [];
  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Escuchar eventos de navegación para recargar datos
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/admin/backups')) {
        this.loadBackups();
        this.loadHistory();
      }
    });
  }

  ngOnInit() {
    console.log('BackupsPage iniciado');
    console.log('API URL:', environment.apiUrl);
    console.log('Token:', localStorage.getItem('token') ? 'presente' : 'no encontrado');
    
    this.loadBackups();
    this.loadHistory();
  }

  loadBackups() {
    console.log('Cargando backups...');
    this.loading = true;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No hay token');
      this.showMessage('No hay sesión activa', 'error');
      this.loading = false;
      return;
    }
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`${environment.apiUrl}/backup/list`, { headers })
      .pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error completo:', error);
          this.loading = false;
          this.showMessage('Error de conexión al servidor', 'error');
          return of({ success: false, data: [] });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta backups:', response);
          if (response.success) {
            this.backups = response.data;
          } else {
            this.showMessage('Error al cargar backups', 'error');
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error en subscribe:', error);
          this.showMessage('Error al cargar backups', 'error');
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadHistory() {
    console.log('Cargando historial...');
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No hay token para historial');
      return;
    }
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(`${environment.apiUrl}/backup/history`, { headers })
      .pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error cargando historial:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta historial:', response);
          if (response.success) {
            this.history = response.data;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error en historial subscribe:', error);
          this.cdr.detectChanges();
        }
      });
  }

  createBackup() {
    if (!confirm('¿Desea crear un backup manual de la base de datos?')) {
      return;
    }

    this.loading = true;
    this.showMessage('Creando backup, por favor espere...', 'success');
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<any>(`${environment.apiUrl}/backup/create`, {}, { headers })
      .pipe(
        timeout(60000), // Aumentar timeout a 60 segundos para operaciones de backup
        catchError(error => {
          console.error('Error creando backup:', error);
          this.loading = false;
          this.showMessage('Error al crear backup: ' + (error.error?.details || error.message), 'error');
          return of({ success: false });
        })
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.showMessage('Backup creado exitosamente', 'success');
            this.loadBackups();
            this.loadHistory();
          } else {
            this.showMessage('Error al crear backup', 'error');
          }
        },
        error: (error) => {
          console.error('Error en subscribe creando backup:', error);
          this.loading = false;
          this.showMessage('Error al crear backup: ' + (error.error?.details || error.message), 'error');
        }
      });
  }

  downloadBackup(fileName: string) {
    const token = localStorage.getItem('token');
    const url = `${environment.apiUrl}/backup/download/${fileName}`;
    
    const link = document.createElement('a');
    link.href = url + `?token=${token}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showMessage('Descargando backup...', 'success');
  }

  deleteBackup(fileName: string) {
    if (!confirm(`¿Está seguro de eliminar el backup "${fileName}"?`)) {
      return;
    }

    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete<any>(`${environment.apiUrl}/backup/${fileName}`, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Backup eliminado correctamente', 'success');
          this.loadBackups();
          this.loadHistory();
        } else {
          this.showMessage('Error al eliminar backup', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error eliminando backup:', error);
        this.showMessage('Error al eliminar backup', 'error');
        this.loading = false;
      }
    });
  }

  restoreBackup(fileName: string) {
    const confirmMsg = `⚠️ ADVERTENCIA ⚠️\n\n` +
      `Esta acción restaurará la base de datos desde el backup "${fileName}".\n\n` +
      `TODOS LOS DATOS ACTUALES SERÁN REEMPLAZADOS.\n\n` +
      `¿Está completamente seguro de continuar?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    if (!confirm('Esta es su última oportunidad. ¿Confirma la restauración?')) {
      return;
    }

    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<any>(`${environment.apiUrl}/backup/restore`, { fileName }, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Base de datos restaurada exitosamente', 'success');
          this.loadHistory();
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.showMessage('Error al restaurar backup', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error restaurando backup:', error);
        this.showMessage('Error al restaurar backup: ' + (error.error?.details || error.message), 'error');
        this.loading = false;
      }
    });
  }

  cleanOldBackups() {
    if (!confirm('¿Desea eliminar todos los backups con más de 30 días de antigüedad?')) {
      return;
    }

    this.loading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post<any>(`${environment.apiUrl}/backup/clean`, {}, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`${response.deletedCount} backups antiguos eliminados`, 'success');
          this.loadBackups();
          this.loadHistory();
        } else {
          this.showMessage('Error al limpiar backups', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error limpiando backups:', error);
        this.showMessage('Error al limpiar backups', 'error');
        this.loading = false;
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-ES');
  }
}
