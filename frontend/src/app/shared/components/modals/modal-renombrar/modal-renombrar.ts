import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { CarpetaService } from '../../../../core/services/carpeta.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-renombrar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-renombrar.html',
  styleUrl: './modal-renombrar.css',
})
export class ModalRenombrar {
  // Datos recibidos desde el explorador
  item = input.required<any>();
  tipo = input.required<'carpeta' | 'archivo'>();

  // Eventos hacia el explorador
  onCerrar = output<void>();
  onGuardado = output<void>();

  private archivoService = inject(ArchivoService);
  private carpetaService = inject(CarpetaService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // Estado del modal
  guardando = signal<boolean>(false);
  extensionArchivo = signal<string>('');

  renombrarForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.prepararFormulario();
  }

  prepararFormulario() {
    const elementoActual = this.item();
    let nombreLimpio = elementoActual.nombre;

    if (this.tipo() === 'archivo' && nombreLimpio.includes('.')) {
      const partes = nombreLimpio.split('.');
      this.extensionArchivo.set(`.${partes.pop()}`);
      nombreLimpio = partes.join('.');
    }

    this.renombrarForm.patchValue({ nombre: nombreLimpio });
  }

  guardar() {
    if (this.renombrarForm.invalid) {
      this.renombrarForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const elementoActual = this.item();
    const esArchivo = this.tipo() === 'archivo';
    
    let nuevoNombre = this.renombrarForm.value.nombre!;
    if (esArchivo) {
      nuevoNombre = `${nuevoNombre}${this.extensionArchivo()}`;
    }

    // Evitamos peticiones innecesarias si el nombre no cambió
    if (nuevoNombre === elementoActual.nombre) {
      this.onCerrar.emit();
      return;
    }

    const request$ = esArchivo 
      ? this.archivoService.renombrarArchivo(elementoActual._id, nuevoNombre)
      : this.carpetaService.renombrarCarpeta(elementoActual._id, nuevoNombre);

    request$.subscribe({
      next: () => {
        this.toastService.mostrarExito(`${esArchivo ? 'Archivo' : 'Carpeta'} renombrado correctamente`);
        this.guardando.set(false);
        this.onGuardado.emit(); // Avisa que hay cambios
        this.onCerrar.emit();   // Cierra el modal
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al renombrar');
        this.guardando.set(false);
      }
    });
  }
}
