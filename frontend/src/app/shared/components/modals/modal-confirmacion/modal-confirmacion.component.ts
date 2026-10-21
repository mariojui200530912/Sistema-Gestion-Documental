import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmacion',
  imports: [CommonModule],
  templateUrl: './modal-confirmacion.component.html',
  styleUrl: './modal-confirmacion.component.css',
})
export class ModalConfirmacionComponent {
  titulo = input.required<string>();
  mensaje = input.required<string>();
  textoBoton = input<string>('Eliminar');
  esPeligroso = input<boolean>(true); // Si es true, el botón será rojo. Si es false, azul.

  onConfirmar = output<void>();
  onCancelar = output<void>();
}
