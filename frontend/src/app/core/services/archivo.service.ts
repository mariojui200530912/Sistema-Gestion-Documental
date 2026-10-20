import { HttpClient } from '@angular/common/http';
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

    return this.http.post<{mensaje: string, archivo: Archivo}>(`${this.apiUrl}/upload`, formData).pipe(
      tap({
        next: (res) => {
          this.carpetaService.archivos.update(archivosActuales => [...archivosActuales, res.archivo]);
        }
      })
    );
  }
}
