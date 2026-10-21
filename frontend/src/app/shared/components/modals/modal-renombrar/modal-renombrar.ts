import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-renombrar',
  imports: [ReactiveFormsModule],
  templateUrl: './modal-renombrar.html',
  styleUrl: './modal-renombrar.css',
})
export class ModalRenombrar {
  form = input.required<FormGroup>();
  tipoItemSeleccionado = input.required<string | null>();
  itemSeleccionado = input.required<any>();

  onCerrar = output<void>();
  onGuardar = output<void>();
}
