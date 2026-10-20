import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  usuarioActual = signal<Usuario | null>(this.obtenerUsuarioDeStorage());
  
  login(correo: string, contrasena: string){
    return this.http.post<any>(`${this.apiUrl}/usuarios/login`, {correo, contrasena}).pipe(
      tap(respuesta => {
        if(respuesta.token){
          localStorage.setItem('token', respuesta.token);
          localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));
          this.usuarioActual.set(respuesta.usuario);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual.set(null); // Limpiamos el signal
    this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  private obtenerUsuarioDeStorage(): Usuario | null {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }
}
