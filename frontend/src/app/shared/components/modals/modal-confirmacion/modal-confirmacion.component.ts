import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { PapeleraService } from '../../../../core/services/papelera.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-confirmacion',
  imports: [CommonModule],
  templateUrl: './modal-confirmacion.component.html',
  styleUrl: './modal-confirmacion.component.css',
})
export class ModalConfirmacionComponent {
  item = input.required<any>();
  tipo = input.required<'carpeta' | 'archivo'>();

  // Emisores
  onCerrar = output<void>();
  onGuardado = output<void>(); // Emite cuando se mueve a la papelera exitosamente

  private papeleraService = inject(PapeleraService);
  private toastService = inject(ToastService);

  procesando = signal<boolean>(false);

  confirmar() {
    this.procesando.set(true);
    const elemento = this.item();
    const tipoActual = this.tipo();

    this.papeleraService.cambiarEstado(elemento._id, tipoActual, 'papelera').subscribe({
      next: () => {
        this.toastService.mostrarExito(`${tipoActual === 'carpeta' ? 'Carpeta enviada' : 'Archivo enviado'} a la papelera`);
        this.procesando.set(false);
        this.onGuardado.emit(); // Avisa al explorador que recargue
        this.onCerrar.emit();   // Cierra el modal
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al mover a la papelera');
        this.procesando.set(false);
      }
    });
  }
}
