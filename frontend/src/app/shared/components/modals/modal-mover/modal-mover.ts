import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { CarpetaService } from '../../../../core/services/carpeta.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-mover',
  imports: [CommonModule],
  templateUrl: './modal-mover.html',
  styleUrl: './modal-mover.css',
})
export class ModalMover {
  // Datos recibidos desde el explorador
  item = input.required<any>();
  tipo = input.required<'carpeta' | 'archivo'>();

  // Eventos hacia el padre
  onCerrar = output<void>();
  onGuardado = output<void>();

  private archivoService = inject(ArchivoService);
  private carpetaService = inject(CarpetaService);
  private toastService = inject(ToastService);

  // Estado interno del modal
  listaCarpetasDestino = signal<any[]>([]);
  carpetaDestinoSeleccionada = signal<string | null>(null);
  
  cargandoCarpetas = signal<boolean>(true);
  moviendo = signal<boolean>(false);

  ngOnInit() {
    this.cargarCarpetasDestino();
  }

  cargarCarpetasDestino() {
    this.cargandoCarpetas.set(true);
    this.carpetaService.obtenerTodasLasCarpetas().subscribe({
      next: (res) => {
        // Excluir el propio elemento para evitar mover una carpeta dentro de sí misma
        const carpetasValidas = res.carpetas.filter((c: any) => c._id !== this.item()._id);
        this.listaCarpetasDestino.set(carpetasValidas);
        this.cargandoCarpetas.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar las carpetas destino');
        this.cargandoCarpetas.set(false);
      }
    });
  }

  seleccionarDestino(id: string | null) {
    this.carpetaDestinoSeleccionada.set(id);
  }

  ejecutarMover() {
    this.moviendo.set(true);
    const actual = this.item();
    const esArchivo = this.tipo() === 'archivo';
    const destinoId = this.carpetaDestinoSeleccionada();

    const request$ = esArchivo
      ? this.archivoService.moverArchivo(actual._id, destinoId)
      : this.carpetaService.moverCarpeta(actual._id, destinoId);

    request$.subscribe({
      next: () => {
        this.toastService.mostrarExito(`${esArchivo ? 'Archivo' : 'Carpeta'} movido correctamente`);
        this.moviendo.set(false);
        this.onGuardado.emit(); // Avisa al explorador que recargue
        this.onCerrar.emit();   // Cierra el modal
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al mover');
        this.moviendo.set(false);
      }
    });
  }
}
