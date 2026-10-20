import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CarpetaService } from '../../core/services/carpeta.service';
import { ToastService } from '../../core/services/toast.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArchivoService } from '../../core/services/archivo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit{
  private authService = inject(AuthService);
  private carpetaService = inject(CarpetaService);
  private archivoService = inject(ArchivoService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  usuario = this.authService.usuarioActual;
  carpetas = this.carpetaService.carpetas;
  archivos = this.carpetaService.archivos;
  cargando = this.carpetaService.cargando;
  carpetaActualId = this.carpetaService.carpetaActualId;
  
  mostrarModalCarpeta = signal<boolean>(false);
  mostrarModalArchivo = signal<boolean>(false);
  archivoSeleccionado = signal<File | null>(null);
  subiendoArchivo = signal<boolean>(false);

  carpetaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.cargarRaiz();
  }

  cargarRaiz() {
    this.carpetaService.obtenerRaiz().subscribe();
  }

  abrirCarpeta(id: string) {
    this.carpetaService.obtenerContenidoCarpeta(id).subscribe();
  }

  abrirModal() {
    this.carpetaForm.reset();
    this.mostrarModalCarpeta.set(true);
  }

  cerrarModal() {
    this.mostrarModalCarpeta.set(false);
  }

  crearCarpeta() {
    if (this.carpetaForm.invalid) return;

    const nombre = this.carpetaForm.value.nombre!;
    const padreId = this.carpetaActualId(); // null si estamos en la raíz, o el ID de la carpeta actual

    this.carpetaService.crearCarpeta(nombre, padreId).subscribe({
      next: () => {
        this.cerrarModal();
        this.toastService.mostrarExito('Carpeta creada correctamente');
      },
      error: (err) => {
        console.error('Error al crear carpeta:', err);
        this.toastService.mostrarError('Error al crear carpeta');
      }
    });
  }

  abrirModalArchivo() {
    this.archivoSeleccionado.set(null);
    this.mostrarModalArchivo.set(true);
  }

  cerrarModalArchivo() {
    this.mostrarModalArchivo.set(false);
    this.archivoSeleccionado.set(null);
  }

  onArchivoSeleccionado(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if(extension === 'txt' || extension === 'md'){
        this.archivoSeleccionado.set(file);
      } else {
        this.archivoSeleccionado.set(null);
        this.toastService.mostrarError("Solo se permiten archivos de texto (.txt) y Markdown (.md)");
        event.target.value = '';
      }
    }
  }

  subirArchivo() {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.subiendoArchivo.set(true);
    const padreId = this.carpetaActualId();

    this.archivoService.subirArchivo(file, padreId).subscribe({
      next: () => {
        this.subiendoArchivo.set(false);
        this.cerrarModalArchivo();
        this.toastService.mostrarExito('Archivo subido correctamente');
      },
      error: (err) => {
        this.subiendoArchivo.set(false);
        console.error('Error al subir archivo:', err);
        this.toastService.mostrarError(err.error?.mensaje || 'Error al subir el archivo');
      }
    });
  }

  cerrarSesion() {
    this.authService.logout;
  }
}
