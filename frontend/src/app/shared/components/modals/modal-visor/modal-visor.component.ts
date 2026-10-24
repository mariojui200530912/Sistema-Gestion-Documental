import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-visor',
  imports: [CommonModule],
  templateUrl: './modal-visor.component.html',
  styleUrl: './modal-visor.component.css',
})
export class ModalVisorComponent implements OnInit{
  archivo = input.required<any>();
  onCerrar = output<void>();

  private archivoService = inject(ArchivoService);
  private toastService = inject(ToastService);

  contenido = signal<string>('');
  cargando = signal<boolean>(true);

  ngOnInit() {
    this.cargarContenido();
  }

  cargarContenido() {
    this.cargando.set(true);
    this.archivoService.descargarArchivo(this.archivo()._id).subscribe({
      next: async (blob: Blob) => {
        try {
          const texto = await blob.text();
          this.contenido.set(texto);
        } catch (error) {
          this.toastService.mostrarError('El archivo no se puede leer como texto');
        } finally {
          this.cargando.set(false);
        }
      },
      error: () => {
        this.toastService.mostrarError('Error al leer el archivo');
        this.cargando.set(false);
        this.onCerrar.emit();
      }
    });
  }
}
