import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PapeleraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/papelera/`;

  obtenerPapelera() {
    return this.http.get<{mensaje: string, contenido: { carpetas: any[], archivos: any[] }}>(this.apiUrl);
  }

  cambiarEstado(id: string, tipo: 'archivo' | 'carpeta', accion: 'papelera' | 'activo') {
    return this.http.post(`${this.apiUrl}estado`, { id, tipo, accion });
  }

  eliminarDefinitivo(id: string, tipo: 'archivo' | 'carpeta') {
    return this.http.post(`${this.apiUrl}eliminar`, { id, tipo });
  }
}
