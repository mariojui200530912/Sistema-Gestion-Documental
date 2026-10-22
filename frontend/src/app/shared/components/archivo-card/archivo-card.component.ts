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
  modoCompartido = input<boolean>(false);
  mostrarInfoCompartido = input<boolean>(false);

  onDescargar = output<void>();
  onToggleMenu = output<Event>();
  onRenombrar = output<Event>();
  onMover = output<Event>();
  onEliminar = output<Event>();
  onRestaurar = output<Event>();
  onEliminarDefinitivo = output<Event>();

  onCompartir = output<Event>();

  obtenerNombrePropietario(): string {
    const prop = this.archivo()?.propietario_id;
    if (!prop) return 'Desconocido';
    if (typeof prop === 'object' && prop.nombres) {
      return `${prop.nombres} ${prop.apellidos || ''}`.trim();
    }
    return 'Otro usuario';
  }

  formatearTamano(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
}
