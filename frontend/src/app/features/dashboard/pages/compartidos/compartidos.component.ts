import { Component, inject, OnInit, signal } from '@angular/core';
import { ComparticionService } from '../../../../core/services/comparticion.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { ExploradorArchivosComponent } from '../../../../shared/components/explorador-archivos/explorador-archivos.component';
import { CarpetaService } from '../../../../core/services/carpeta.service';

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
  private carpetaService = inject(CarpetaService);
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
    this.rutaActual.set([{ nombre: 'Compartidos Conmigo', id: null }]);
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
    this.cargando.set(true);
    this.rutaActual.update(ruta => [...ruta, { id: carpeta._id, nombre: carpeta.nombre }]);
    
    this.carpetaService.obtenerContenidoCarpeta(carpeta._id, carpeta.nombre).subscribe({
      next: (res: any) => {
         this.carpetas.set(res.contenido.carpetas || []);
         this.archivos.set(res.contenido.archivos || []);
         this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
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
    if (id === null) {
      this.cargarCompartidos();
    } else {
      this.cargando.set(true);
      this.rutaActual.update(ruta => ruta.slice(0, index + 1));
      this.carpetaService.obtenerContenidoCarpeta(id, '').subscribe({
        next: (res: any) => {
           this.carpetas.set(res.contenido.carpetas || []);
           this.archivos.set(res.contenido.archivos || []);
           this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
    }
  }
}
