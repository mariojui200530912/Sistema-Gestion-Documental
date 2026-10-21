import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-modal-compartir',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-compartir.component.html',
  styleUrl: './modal-compartir.component.css',
})
export class ModalCompartirComponent {
  itemSeleccionado = input.required<any>();
  tipoItem = input.required<'archivo' | 'carpeta'>();
  compartiendo = input<boolean>(false);

  onCerrar = output<void>();
  onCompartir = output<{ correo: string, permiso: string }>();

  private fb = inject(FormBuilder);
  
  form: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    permiso: ['lectura', Validators.required]
  });

  enviar() {
    if (this.form.valid) {
      this.onCompartir.emit(this.form.value);
    }
  }
}
