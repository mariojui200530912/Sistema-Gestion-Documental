import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CarpetaService } from '../../../../core/services/carpeta.service';

@Component({
  selector: 'app-modal-comentario',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-comentario.component.html',
  styleUrl: './modal-comentario.component.css',
})
export class ModalComentarioComponent implements OnInit{
  item = input.required<any>();
  tipo = input<'archivo' | 'carpeta'>('archivo');

  onCerrar = output<void>();
  onComentarioAgregado = output<void>();

  private archivoService = inject(ArchivoService);
  private carpetaService = inject(CarpetaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  usuarioActual = this.authService.usuarioActual;
  comentarios = signal<any[]>([]);
  nuevoComentario = signal<string>('');
  enviando = signal<boolean>(false);

  ngOnInit() {
    this.comentarios.set(this.item().comentarios || []);
  }

  enviarComentario() {
    if (!this.nuevoComentario().trim()) return;

    this.enviando.set(true);
    const id = this.item()._id || this.item().id;
    const texto = this.nuevoComentario();

    const peticion$ = this.tipo() === 'carpeta' 
      ? this.carpetaService.agregarComentario(id, texto)
      : this.archivoService.agregarComentario(id, texto);

    peticion$.subscribe({
      next: (res: any) => {
        this.comentarios.set(res.comentarios || res); 
        this.nuevoComentario.set('');
        this.enviando.set(false);
        this.onComentarioAgregado.emit();
      },
      error: (err) => {
        if (err.status === 403) {
          this.toastService.mostrarError('No tienes permiso para comentar');
        } else {
          this.toastService.mostrarError('Error al enviar el comentario');
        }
        this.enviando.set(false);
      }
    });
  }

  esMiComentario(idUsuario: any): boolean {
    const miId = this.usuarioActual()?.id;
    const idAutor = typeof idUsuario === 'object' ? idUsuario._id : idUsuario;
    return miId === idAutor;
  }

  obtenerNombreAutor(comentario: any): string {
    const miId = this.authService.usuarioActual()?.id;
    const autor = comentario.usuario_id;
    
    if (!autor) return 'Usuario desconocido';
    
    const autorId = autor._id || autor;
    if (autorId === miId) return 'Tú';
    
    if (autor.nombres) {
      return `${autor.nombres} ${autor.apellidos || ''}`.trim();
    }
    
    return 'Otro usuario';
  }
}
