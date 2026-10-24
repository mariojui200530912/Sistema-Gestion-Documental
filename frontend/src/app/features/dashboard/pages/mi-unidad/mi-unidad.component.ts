import { Component, inject, OnInit, signal } from '@angular/core';
import { CarpetaService } from '../../../../core/services/carpeta.service';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExploradorArchivosComponent } from '../../../../shared/components/explorador-archivos/explorador-archivos.component';

type TipoItem = 'carpeta' | 'archivo';

@Component({
  selector: 'app-mi-unidad',
  host: { class: 'flex-1 flex flex-col min-h-0 overflow-hidden' },
  imports: [CommonModule, ExploradorArchivosComponent],
  templateUrl: './mi-unidad.component.html',
  styleUrl: './mi-unidad.component.css',
})
export class MiUnidadComponent implements OnInit{
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private carpetaService = inject(CarpetaService);
  private archivoService = inject(ArchivoService);
  private toastService = inject(ToastService);

  carpetas = this.carpetaService.carpetas;
  archivos = this.carpetaService.archivos;
  cargando = this.carpetaService.cargando;
  rutaActual = this.carpetaService.rutaActual;
  carpetaActualId = this.carpetaService.carpetaActualId;

  esContextoCompartido = signal<boolean>(false);
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Detectar dinamicamente el contexto actual desde la URL
      const esCompartido = this.router.url.includes('compartidos');
      this.esContextoCompartido.set(esCompartido);

      // Validar y limpiar el estado residual del CarpetaService
      const nombreRaiz = esCompartido ? 'Compartidos Conmigo' : 'Mi Unidad';
      const rutaGuardada = this.rutaActual(); // Lee el signal del servicio
      
      if (rutaGuardada.length === 0 || rutaGuardada[0].nombre !== nombreRaiz) {
        // Resetea la navegación a la raiz correcta antes de cargar el contenido
        this.carpetaService.rutaActual.set([{ id: null, nombre: nombreRaiz }]);
        this.carpetaService.carpetaActualId.set(null);
      }

      // Flujo normal de carga de contenido
      if (params['id'] && params['nombre']) {
        this.carpetaService.obtenerContenidoCarpeta(params['id'], params['nombre']).subscribe();
      } else if (params['folder']) {
        this.carpetaService.obtenerContenidoCarpeta(params['folder'], 'Carpeta').subscribe();
      } else {
        if (this.esContextoCompartido()) {
          this.router.navigate(['/dashboard/compartidos']);
        } else {
          this.cargarRaiz();
        }
      }
    });
  }

  cargarRaiz() {
    this.carpetaService.obtenerRaiz().subscribe();
  }

  abrirCarpeta(carpeta: any) {
    this.carpetaService.obtenerContenidoCarpeta(carpeta._id, carpeta.nombre).subscribe();
  }

  navegarBreadcrumb(index: number, id: string | null) {
    if (id === null) {
      if (this.esContextoCompartido()) {
        this.router.navigate(['/dashboard/compartidos']);
      } else {
        this.cargarRaiz();
      }
    } else {
      this.carpetaService.obtenerContenidoCarpeta(id, '', index).subscribe();
    }
  }

  descargarArchivo(archivo: any) {
    this.toastService.mostrarExito(`Descargando ${archivo.nombre}...`);
    this.archivoService.descargarArchivo(archivo._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        this.toastService.mostrarError('Error al descargar el archivo');
      }
    });
  }

  recargarContenidoActual() {
    const idPadre = this.carpetaActualId();
    if (idPadre) {
      const ruta = this.rutaActual();
      const nombreCarpeta = ruta[ruta.length - 1].nombre;
      const indiceActual = ruta.length - 1;
      this.carpetaService.obtenerContenidoCarpeta(idPadre, nombreCarpeta, indiceActual).subscribe();
    } else {
      this.cargarRaiz();
    }
  }
}
