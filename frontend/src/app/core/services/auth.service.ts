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
        if (respuesta.token && respuesta.usuario) {
          const usuarioNormalizado: Usuario = {
            ...respuesta.usuario,
            id: respuesta.usuario.id || respuesta.usuario._id
          };
          
          localStorage.setItem('token', respuesta.token);
          localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado));
          this.usuarioActual.set(usuarioNormalizado);
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
    if (!usuarioStr) return null;
    
    const rawUser = JSON.parse(usuarioStr);
    return {
      ...rawUser,
      id: rawUser.id || rawUser._id
    };
  }

  refrescarUsuarioActual() {
    const user = this.usuarioActual();
    const id = user?.id;
    if (!id) return;

    this.http.get<any>(`${this.apiUrl}/usuarios/${id}`).subscribe({
      next: (res) => {
        if (res.usuario) {
          const actualizado: Usuario = {
            ...res.usuario,
            id: res.usuario.id || res.usuario._id
          };
          localStorage.setItem('usuario', JSON.stringify(actualizado));
          this.usuarioActual.set(actualizado);
        }
      }
    });
  }
}
