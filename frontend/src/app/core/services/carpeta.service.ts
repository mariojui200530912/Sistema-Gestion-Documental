import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';
import { Archivo, Carpeta } from '../models/recurso.model';

interface RespuestaContenido {
  mensaje: string;
  contenido: {
    carpetas: Carpeta[];
    archivos: Archivo[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class CarpetaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/carpetas/`;

  carpetas = signal<Carpeta[]>([]);
  archivos = signal<Archivo[]>([]);
  cargando = signal<boolean>(false);
  carpetaActualId = signal<string | null>(null);

  crearCarpeta(nombre: string, carpeta_padre_id: string | null) {
    return this.http.post<{mensaje: string, carpeta: Carpeta}>(this.apiUrl, { nombre, carpeta_padre_id}).pipe(
      tap({
        next: (res) => {
          this.carpetas.update(carpetasActuales => [...carpetasActuales, res.carpeta]);
        }
      })
    );
  }

  obtenerRaiz() {
    this.cargando.set(true);
    this.carpetaActualId.set(null); // Estamos en la raíz
    
    return this.http.get<RespuestaContenido>(this.apiUrl).pipe(
      tap({
        next: (res) => {
          this.carpetas.set(res.contenido.carpetas);
          this.archivos.set(res.contenido.archivos);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      })
    );
  }

  obtenerContenidoCarpeta(id: string) {
    this.cargando.set(true);
    this.carpetaActualId.set(id);

    return this.http.get<RespuestaContenido>(`${this.apiUrl}${id}`).pipe(
      tap({
        next: (res) => {
          this.carpetas.set(res.contenido.carpetas);
          this.archivos.set(res.contenido.archivos);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      })
    );
  }
}
