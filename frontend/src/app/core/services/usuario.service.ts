import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  obtenerUsuarios() {
    return this.http.get<{ usuarios: any[] }>(this.apiUrl);
  }

  actualizarUsuario(id: string, datos: any) {
    return this.http.put<{ message: string; usuario: any }>(`${this.apiUrl}/${id}`, datos);
  }

  desactivarUsuario(id: string) {
    return this.http.delete<{ mensaje: string; usuario: any }>(`${this.apiUrl}/${id}`);
  }
}
