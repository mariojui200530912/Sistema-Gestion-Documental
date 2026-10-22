import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { PapeleraService } from '../../../../core/services/papelera.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modal-eliminar-definitivo',
  imports: [CommonModule],
  templateUrl: './modal-eliminar-definitivo.component.html',
  styleUrl: './modal-eliminar-definitivo.component.css',
})
export class ModalEliminarDefinitivoComponent {
  private authService = inject(AuthService);
  item = input.required<any>();
  tipo = input.required<'carpeta' | 'archivo'>();

  onCerrar = output<void>();
  onGuardado = output<void>();

  private papeleraService = inject(PapeleraService);
  private toastService = inject(ToastService);

  procesando = signal<boolean>(false);

  eliminar() {
    this.procesando.set(true);
    this.papeleraService.eliminarDefinitivo(this.item()._id, this.tipo()).subscribe({
      next: () => {
        this.toastService.mostrarExito('Elemento eliminado definitivamente');
        this.procesando.set(false);
        this.authService.refrescarUsuarioActual();
        this.onGuardado.emit();
        this.onCerrar.emit();
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al eliminar');
        this.procesando.set(false);
      }
    });
  }
}
