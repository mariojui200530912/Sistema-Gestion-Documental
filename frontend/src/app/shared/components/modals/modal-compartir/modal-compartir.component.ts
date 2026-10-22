import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComparticionService } from '../../../../core/services/comparticion.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-compartir',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-compartir.component.html',
  styleUrl: './modal-compartir.component.css',
})
export class ModalCompartirComponent {
  // Datos del elemento a compartir
  item = input.required<any>();
  tipo = input.required<'carpeta' | 'archivo'>();

  // Eventos hacia el padre
  onCerrar = output<void>();
  onGuardado = output<void>(); // Se emite cada vez que los permisos cambian

  private comparticionService = inject(ComparticionService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // Estado interno
  compartiendo = signal<boolean>(false);
  listaAccesos = signal<any[]>([]);
  cargandoAccesos = signal<boolean>(true);

  // Formulario
  compartirForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    permiso: ['lectura', Validators.required] // Por defecto en modo lectura
  });

  ngOnInit() {
    this.cargarAccesos();
  }

  cargarAccesos() {
    this.cargandoAccesos.set(true);
    this.comparticionService.obtenerAccesos(this.item()._id, this.tipo()).subscribe({
      next: (res) => {
        this.listaAccesos.set(res.accesos || []);
        this.cargandoAccesos.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar la lista de accesos');
        this.cargandoAccesos.set(false);
      }
    });
  }

  compartir() {
    if (this.compartirForm.invalid) {
      this.compartirForm.markAllAsTouched();
      return;
    }

    this.compartiendo.set(true);
    const { correo, permiso } = this.compartirForm.value;

    this.comparticionService.compartirRecurso(this.item()._id, this.tipo(), correo!, permiso!).subscribe({
      next: () => {
        this.toastService.mostrarExito('Recurso compartido exitosamente');
        this.compartirForm.reset({ permiso: 'lectura' }); // Limpiamos solo el correo
        this.cargarAccesos(); // Recargamos la lista del modal
        this.onGuardado.emit(); // Avisamos al padre (Explorador)
        this.compartiendo.set(false);
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al compartir recurso');
        this.compartiendo.set(false);
      }
    });
  }

  revocar(idUsuario: string) {
    this.comparticionService.revocarPermiso(this.item()._id, this.tipo(), idUsuario).subscribe({
      next: () => {
        this.toastService.mostrarExito('Acceso revocado correctamente');
        this.cargarAccesos();
        this.onGuardado.emit();
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al revocar acceso');
      }
    });
  }
}
