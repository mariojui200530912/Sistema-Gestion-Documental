import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-carpeta',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-carpeta.html',
  styleUrl: './modal-carpeta.css',
})
export class ModalCarpeta {
  form = input.required<FormGroup>();
  
  onCerrar = output<void>();
  onGuardar = output<void>();
}
