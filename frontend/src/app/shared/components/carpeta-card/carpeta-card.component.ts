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
  modoCompartido = input<boolean>(false);
  nivelPermiso = input<string>('lectura');
  mostrarInfoCompartido = input<boolean>(false);

  onAbrir = output<void>();
  onToggleMenu = output<Event>();
  onRenombrar = output<Event>();
  onMover = output<Event>();
  onEliminar = output<Event>();
  onRestaurar = output<Event>();
  onEliminarDefinitivo = output<Event>();

  onCompartir = output<Event>();
  onComentar = output<Event>();
  onRevocar = output<Event>();

  obtenerNombrePropietario(): string {
    const prop = this.carpeta()?.propietario_id;
    if (!prop) return 'Desconocido';
    if (typeof prop === 'object' && prop.nombres) {
      return `${prop.nombres} ${prop.apellidos || ''}`.trim();
    }
    return 'Otro usuario';
  }
}
