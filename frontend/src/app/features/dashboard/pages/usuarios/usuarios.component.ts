import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit{
  private usuarioService = inject(UsuarioService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  usuarioActual = this.authService.usuarioActual;
  sinPermisos = signal<boolean>(false);
  cargando = signal<boolean>(true);
  usuarios = signal<any[]>([]);

  // Estado del Modal de Edición
  usuarioEditando = signal<any | null>(null);
  editRol = signal<string>('usuario');
  editEspacioMB = signal<number>(10);

  ngOnInit() {
    const rol = this.usuarioActual()?.rol;
    if (rol !== 'administrador') {
      this.sinPermisos.set(true);
      this.cargando.set(false);
      return;
    }
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (res) => {
        this.usuarios.set(res.usuarios || []);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar la lista de usuarios');
        this.cargando.set(false);
      }
    });
  }

  abrirEdicion(usuario: any) {
    this.usuarioEditando.set(usuario);
    this.editRol.set(usuario.rol);
    // Convertir bytes a MB para que sea fácil de editar
    this.editEspacioMB.set(Math.round((usuario.espacioAsignado || 10485760) / 1048576));
  }

  cerrarEdicion() {
    this.usuarioEditando.set(null);
  }

  guardarCambios() {
    const usuario = this.usuarioEditando();
    if (!usuario) return;

    const id = usuario._id || usuario.id;
    const datos = {
      rol: this.editRol(),
      espacioAsignado: this.editEspacioMB() * 1048576 // Convertir MB a bytes
    };

    this.usuarioService.actualizarUsuario(id, datos).subscribe({
      next: () => {
        this.toastService.mostrarExito('Usuario actualizado correctamente');
        this.cargarUsuarios();
        this.cerrarEdicion();
      },
      error: () => this.toastService.mostrarError('Error al actualizar usuario')
    });
  }

  cambiarEstado(usuario: any) {
    const id = usuario._id || usuario.id;
    const accion = usuario.estado === 'activo' ? 'desactivar' : 'activar';
    
    if (confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) {
      if (accion === 'desactivar') {
        this.usuarioService.desactivarUsuario(id).subscribe({
          next: () => {
            this.toastService.mostrarExito('Usuario desactivado');
            this.cargarUsuarios();
          },
          error: () => this.toastService.mostrarError('Error al desactivar usuario')
        });
      } else {
        this.usuarioService.actualizarUsuario(id, { estado: 'activo' }).subscribe({
          next: () => {
            this.toastService.mostrarExito('Usuario activado');
            this.cargarUsuarios();
          },
          error: () => this.toastService.mostrarError('Error al activar usuario')
        });
      }
    }
  }

  formatearTamano(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
}
