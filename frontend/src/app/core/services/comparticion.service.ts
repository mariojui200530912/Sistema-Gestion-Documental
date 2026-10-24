import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComparticionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compartir`; 

  compartirRecurso(idRecurso: string, tipoRecurso: 'archivo' | 'carpeta', correoBeneficiario: string, nivelPermiso: string) {
    return this.http.post(`${this.apiUrl}/`, {
      id_recurso: idRecurso,
      tipo_recurso: tipoRecurso,
      correo_beneficiario: correoBeneficiario,
      nivel_permiso: nivelPermiso
    });
  }

  revocarPermiso(id_recurso: string, tipo_recurso: string, id_usuario_revocar: string) {
    return this.http.delete(`${this.apiUrl}/revocar`, {
      body: { 
        id_recurso: id_recurso, 
        tipo_recurso: tipo_recurso, 
        id_usuario_revocar: id_usuario_revocar 
      }
    });
  }

  obtenerCompartidosConmigo() {
    return this.http.get<{ carpetas: any[], archivos: any[] }>(`${this.apiUrl}/conmigo`);
  }

  obtenerAccesos(idRecurso: string, tipoRecurso: 'archivo' | 'carpeta') {
    return this.http.get<{ mensaje: string, accesos: any[] }>(`${this.apiUrl}/accesos/${tipoRecurso}/${idRecurso}`);
  }
}
