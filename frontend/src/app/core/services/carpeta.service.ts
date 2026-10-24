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

export interface RutaBreadcrumb {
  id: string | null;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class CarpetaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/carpetas`;

  carpetas = signal<Carpeta[]>([]);
  archivos = signal<Archivo[]>([]);
  cargando = signal<boolean>(false);
  carpetaActualId = signal<string | null>(null);
  rutaActual = signal<RutaBreadcrumb[]>([{ id: null, nombre: 'Mi unidad' }]);

  crearCarpeta(nombre: string, carpeta_padre_id: string | null) {
    return this.http.post<{mensaje: string, carpeta: Carpeta}>(`${this.apiUrl}/`, { nombre, carpeta_padre_id}).pipe(
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
    this.rutaActual.set([{ id: null, nombre: 'Mi unidad' }]);
    
    return this.http.get<RespuestaContenido>(`${this.apiUrl}/`).pipe(
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

  obtenerContenidoCarpeta(id: string, nombre: string, indexBreadcrumb?: number) {
    this.cargando.set(true);
    this.carpetaActualId.set(id);

    if(indexBreadcrumb !== undefined){
      this.rutaActual.update(ruta => ruta.slice(0, indexBreadcrumb + 1))
    } else {
      this.rutaActual.update(ruta => [...ruta, { id, nombre }]);
    }
    return this.http.get<RespuestaContenido>(`${this.apiUrl}/${id}`).pipe(
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

  obtenerTodasLasCarpetas() {
    return this.http.get<{mensaje: string, carpetas: any[]}>(`${this.apiUrl}/todas`); 
  }

  renombrarCarpeta(id: string, nuevoNombre: string) {
    return this.http.put(`${this.apiUrl}/${id}/renombrar`, { nuevo_nombre: nuevoNombre });
  }

  moverCarpeta(id: string, nuevaCarpetaId: string | null) {
    return this.http.put(`${this.apiUrl}/${id}/mover`, { nueva_carpeta_padre_id: nuevaCarpetaId });
  }

  agregarComentario(idCarpeta: string, texto: string) {
    return this.http.post<{ mensaje: string, comentarios: any[] }>(`${this.apiUrl}/${idCarpeta}/comentarios`, { texto });
  }
}
