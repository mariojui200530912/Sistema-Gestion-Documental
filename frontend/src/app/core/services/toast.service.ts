import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface ToastState {
  mensaje: string;
  tipo: ToastType;
  visible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  estado = signal<ToastState>({mensaje:'', tipo: 'success', visible: false});
  private timeoutId: any;

  mostrarExito(mensaje: string) {
    this.mostrar(mensaje, 'success');
  }

  mostrarError(mensaje: string) {
    this.mostrar(mensaje, 'error');
  }

  private mostrar(mensaje: string, tipo: ToastType) {
    this.estado.set({ mensaje, tipo, visible: true });

    if (this.timeoutId) clearTimeout(this.timeoutId);

    // Ocultar automáticamente a los 3 segundos
    this.timeoutId = setTimeout(() => {
      this.ocultar();
    }, 3000);
  }

  ocultar() {
    this.estado.update(estadoActual => ({ ...estadoActual, visible: false }));
  }
}
