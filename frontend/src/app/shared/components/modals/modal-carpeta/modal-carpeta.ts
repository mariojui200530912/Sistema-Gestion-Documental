import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarpetaService } from '../../../../core/services/carpeta.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-carpeta',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-carpeta.html',
  styleUrl: './modal-carpeta.css',
})
export class ModalCarpeta {
  private carpetaService = inject(CarpetaService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // Emisores para el componente padre
  onCerrar = output<void>();
  onGuardado = output<void>();


  // Estado del formulario y del proceso de guardado
  guardando = signal<boolean>(false);

  carpetaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
  });

  crearCarpeta() {
    if (this.carpetaForm.invalid) {
      this.carpetaForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const nombreCarpeta = this.carpetaForm.value.nombre!;
    const idPadre = this.carpetaService.carpetaActualId();

    this.carpetaService.crearCarpeta(nombreCarpeta, idPadre).subscribe({
      next: () => {
        this.toastService.mostrarExito(`Carpeta "${nombreCarpeta}" creada`);
        this.guardando.set(false);
        this.onGuardado.emit(); // Avisa que hay nueva data
        this.onCerrar.emit();   // Cierra el modal
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al crear la carpeta');
        this.guardando.set(false);
      }
    });
  }
}
