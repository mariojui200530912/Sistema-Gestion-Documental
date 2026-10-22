import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modal-archivo',
  imports: [CommonModule],
  templateUrl: './modal-archivo.html',
  styleUrl: './modal-archivo.css',
})
export class ModalArchivo {
  private authService = inject(AuthService);
  carpetaActualId = input<string | null>(null);

  // Emisores para controlar la vista del padre
  onCerrar = output<void>();
  onGuardado = output<void>();

  private archivoService = inject(ArchivoService);
  private toastService = inject(ToastService);

  // Estado interno del modal
  archivoSeleccionado = signal<File | null>(null);
  subiendoArchivo = signal<boolean>(false);

  onSeleccionar(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
    }
  }

  subirArchivo() {
    const file = this.archivoSeleccionado();
    if (!file) {
      this.toastService.mostrarError('Por favor selecciona un archivo primero');
      return;
    }

    this.subiendoArchivo.set(true);
    const carpetaId = this.carpetaActualId();

    this.archivoService.subirArchivo(file, carpetaId).subscribe({
      next: () => {
        this.toastService.mostrarExito('Archivo subido correctamente');
        this.subiendoArchivo.set(false);
        this.authService.refrescarUsuarioActual();
        this.onGuardado.emit(); // Avisa al explorador que recargue
        this.onCerrar.emit();   // Cierra el modal
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al subir el archivo');
        this.subiendoArchivo.set(false);
      }
    });
  }
}
