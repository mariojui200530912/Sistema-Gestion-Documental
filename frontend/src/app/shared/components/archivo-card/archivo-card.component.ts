import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-archivo-card',
  imports: [],
  templateUrl: './archivo-card.component.html',
  styleUrl: './archivo-card.component.css',
})
export class ArchivoCardComponent {
  archivo = input.required<any>();
  menuActivo = input.required<boolean>();
  modoPapelera = input<boolean>(false);

  onDescargar = output<void>();
  onToggleMenu = output<Event>();
  onRenombrar = output<Event>();
  onMover = output<Event>();
  onEliminar = output<Event>();
  onRestaurar = output<Event>();
  onEliminarDefinitivo = output<Event>();

  onCompartir = output<Event>();
}
