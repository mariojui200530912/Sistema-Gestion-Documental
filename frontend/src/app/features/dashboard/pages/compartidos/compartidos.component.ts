import { Component, inject, OnInit, signal } from '@angular/core';
import { ComparticionService } from '../../../../core/services/comparticion.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { CarpetaCardComponent } from '../../../../shared/components/carpeta-card/carpeta-card.component';
import { ArchivoCardComponent } from '../../../../shared/components/archivo-card/archivo-card.component';
import { Router } from '@angular/router';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExploradorArchivosComponent } from '../../../../shared/components/explorador-archivos/explorador-archivos.component';

@Component({
  selector: 'app-compartidos',
  host: { class: 'flex-1 flex flex-col min-h-0 overflow-hidden' },
  imports: [CommonModule, ExploradorArchivosComponent],
  templateUrl: './compartidos.component.html',
  styleUrl: './compartidos.component.css',
})
export class CompartidosComponent implements OnInit{
  private comparticionService = inject(ComparticionService);
  private archivoService = inject(ArchivoService); 
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Signals de estado
  carpetas = signal<any[]>([]);
  archivos = signal<any[]>([]);
  cargando = signal<boolean>(true);

  rutaActual = signal([{ nombre: 'Compartidos Conmigo', id: null }]);

  ngOnInit() {
    this.cargarCompartidos();
  }

  cargarCompartidos() {
    this.cargando.set(true);
    this.comparticionService.obtenerCompartidosConmigo().subscribe({
      next: (res) => {
        this.carpetas.set(res.carpetas || []);
        this.archivos.set(res.archivos || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar recursos compartidos');
        this.cargando.set(false);
      }
    });
  }

  abrirCarpeta(carpeta: any) {
    this.router.navigate(['/dashboard/compartidos/carpeta'], { 
      queryParams: { 
        id: carpeta._id, 
        nombre: carpeta.nombre 
      } 
    });
  }

  descargarArchivo(archivo: any) {
    this.toastService.mostrarExito(`Iniciando descarga de "${archivo.nombre}"...`);
    this.archivoService.descargarArchivo(archivo._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.mostrarError('No tienes permisos o el archivo ya no existe');
      }
    });
  }

  navegarBreadcrumb(index: number, id: string | null) {
    this.cargarCompartidos();
  }
}
