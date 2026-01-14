import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, Configuracion } from '../../services/config.service';

@Component({
    selector: 'app-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuracion.html',
    styleUrls: ['./configuracion.css']
})
export class ConfiguracionComponent implements OnInit {
    configuraciones: Configuracion[] = [];
    loading = false;
    guardando = false;

    // Agrupación de configs
    configsEnvio: Configuracion[] = [];
    configsGeneral: Configuracion[] = [];
    configsContacto: Configuracion[] = [];

    constructor(
        private configService: ConfigService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadConfiguraciones();
    }

    loadConfiguraciones() {
        this.loading = true;
        this.configService.getAll().subscribe({
            next: (data) => {
                this.configuraciones = data;
                this.agruparConfiguraciones();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar configuraciones:', err);
                alert('Error al cargar las configuraciones');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    agruparConfiguraciones() {
        this.configsEnvio = this.configuraciones.filter(c => 
            c.clave.includes('tarifa') || c.clave.includes('radio') || c.clave.includes('tiempo') || 
            c.clave.includes('lat_local') || c.clave.includes('lon_local')
        );

        this.configsContacto = this.configuraciones.filter(c => 
            c.clave.includes('telefono') || c.clave.includes('email')
        );

        this.configsGeneral = this.configuraciones.filter(c => 
            !this.configsEnvio.includes(c) && !this.configsContacto.includes(c)
        );
    }

    guardarConfiguracion(config: Configuracion) {
        this.guardando = true;
        this.configService.update(config.clave, config.valor).subscribe({
            next: () => {
                alert(`Configuración "${config.descripcion}" actualizada correctamente`);
                this.guardando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al actualizar configuración:', err);
                alert('Error al guardar la configuración');
                this.guardando = false;
                this.cdr.detectChanges();
            }
        });
    }

    guardarTodo() {
        if (!confirm('¿Está seguro de guardar todas las configuraciones?')) {
            return;
        }

        this.guardando = true;
        const updates = this.configuraciones.map(c => ({ clave: c.clave, valor: c.valor }));

        this.configService.updateMultiple(updates).subscribe({
            next: () => {
                alert('Todas las configuraciones se guardaron correctamente');
                this.loadConfiguraciones();
            },
            error: (err) => {
                console.error('Error al guardar configuraciones:', err);
                alert('Error al guardar las configuraciones');
                this.guardando = false;
                this.cdr.detectChanges();
            }
        });
    }

    getInputType(tipo: string): string {
        if (tipo === 'numero') return 'number';
        if (tipo === 'boolean') return 'checkbox';
        return 'text';
    }

    onCheckboxChange(config: Configuracion, event: any) {
        config.valor = event.target.checked ? 'true' : 'false';
    }

    isBoolean(config: Configuracion): boolean {
        return config.tipo === 'boolean';
    }

    getBooleanValue(valor: string): boolean {
        return valor === 'true' || valor === '1';
    }
}
