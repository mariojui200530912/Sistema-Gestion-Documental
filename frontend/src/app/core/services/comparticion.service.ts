import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComparticionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compartir/`; 

  compartirRecurso(idRecurso: string, tipoRecurso: 'archivo' | 'carpeta', correoBeneficiario: string, nivelPermiso: string) {
    return this.http.post(`${this.apiUrl}`, {
      idRecurso,
      tipoRecurso,
      correoBeneficiario,
      nivelPermiso
    });
  }

  revocarPermiso(idRecurso: string, tipoRecurso: 'archivo' | 'carpeta', idUsuarioRevocar: string) {
    return this.http.delete(`${this.apiUrl}/revocar`, {
      body: { idRecurso, tipoRecurso, idUsuarioRevocar }
    });
  }

  obtenerCompartidosConmigo() {
    return this.http.get<{ carpetas: any[], archivos: any[] }>(`${this.apiUrl}/conmigo`);
  }
}
