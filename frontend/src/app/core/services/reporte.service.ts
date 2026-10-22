import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  obtenerReporteArchivos(filtros?: { fechaInicio?: string; fechaFin?: string }) {
    let params = new HttpParams();
    if (filtros?.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get<any>(`${this.apiUrl}/archivos`, { params });
  }

  obtenerReporteUsuarios() {
    return this.http.get<any>(`${this.apiUrl}/usuarios`);
  }

  obtenerReporteComparticion(usuarioId?: string) {
    let params = new HttpParams();
    if (usuarioId) params = params.set('usuarioId', usuarioId);
    return this.http.get<any>(`${this.apiUrl}/comparticion`, { params });
  }

  obtenerReporteActividad(filtros?: { usuarioId?: string; fechaInicio?: string; fechaFin?: string; periodo?: string }) {
    let params = new HttpParams();
    if (filtros?.usuarioId) params = params.set('usuarioId', filtros.usuarioId);
    if (filtros?.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros?.periodo) params = params.set('periodo', filtros.periodo);
    return this.http.get<any>(`${this.apiUrl}/actividad`, { params });
  }
}
