import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-carpeta-card',
  imports: [],
  templateUrl: './carpeta-card.component.html',
  styleUrl: './carpeta-card.component.css',
})
export class CarpetaCardComponent {
  carpeta = input.required<any>();
  menuActivo = input.required<boolean>();
  modoPapelera = input<boolean>(false);

  onAbrir = output<void>();
  onToggleMenu = output<Event>();
  onRenombrar = output<Event>();
  onMover = output<Event>();
  onEliminar = output<Event>();
  onRestaurar = output<Event>();
  onEliminarDefinitivo = output<Event>();

  onCompartir = output<Event>();
}
