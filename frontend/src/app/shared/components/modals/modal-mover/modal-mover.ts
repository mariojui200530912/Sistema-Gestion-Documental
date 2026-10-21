import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-mover',
  imports: [FormsModule],
  templateUrl: './modal-mover.html',
  styleUrl: './modal-mover.css',
})
export class ModalMover {
  itemSeleccionado = input.required<any>();
  listaCarpetasDestino = input.required<any[]>();
  carpetaDestinoSeleccionada = input.required<string | null>();

  onCerrar = output<void>();
  onDestinoChange = output<string | null>();
  onMover = output<void>();
}
