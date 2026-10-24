import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CarpetaService } from './carpeta.service';
import { environment } from '../../../environments/environment';
import { Archivo } from '../models/recurso.model';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArchivoService {
  private http = inject(HttpClient);
  private carpetaService = inject(CarpetaService); 
  private apiUrl = `${environment.apiUrl}/archivos`;

  subirArchivo(archivo: File, carpetaId: string | null) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (carpetaId) {
      formData.append('carpeta_id', carpetaId);
    }

    const headers = new HttpHeaders({
      'x-archivo-nombre': archivo.name,
      'x-archivo-tamano': archivo.size.toString(),
      'x-carpeta-id': carpetaId || ''
    });

    return this.http.post<{mensaje: string, archivo: Archivo}>(`${this.apiUrl}/upload`, formData, { headers }).pipe(
      tap({
        next: (res) => {
          this.carpetaService.archivos.update(archivosActuales => [...archivosActuales, res.archivo]);
        }
      })
    );
  }

  descargarArchivo(id: string) {
    return this.http.get(`${this.apiUrl}/descargar/${id}`, { responseType: 'blob' });
  }

  renombrarArchivo(id: string, nuevoNombre: string) {
    return this.http.put(`${this.apiUrl}/${id}/renombrar`, { nuevo_nombre: nuevoNombre });
  }

  moverArchivo(id: string, nuevaCarpetaId: string | null) {
    return this.http.put(`${this.apiUrl}/${id}/mover`, { nueva_carpeta_id: nuevaCarpetaId });
  }

  agregarComentario(idArchivo: string, texto: string) {
    return this.http.post<{ mensaje: string, comentarios: any[] }>(`${this.apiUrl}/${idArchivo}/comentarios`, { texto });
  }
}
