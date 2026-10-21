import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-archivo',
  imports: [CommonModule],
  templateUrl: './modal-archivo.html',
  styleUrl: './modal-archivo.css',
})
export class ModalArchivo {
  archivoSeleccionado = input<any>(null);
  subiendoArchivo = input<boolean>(false);

  onCerrar = output<void>();
  onSeleccionar = output<Event>();
  onSubir = output<void>();
}
