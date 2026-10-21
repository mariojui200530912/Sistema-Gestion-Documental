import { Component, inject, OnInit, signal } from '@angular/core';
import { PapeleraService } from '../../../../core/services/papelera.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { CarpetaCardComponent } from '../../../../shared/components/carpeta-card/carpeta-card.component';
import { ArchivoCardComponent } from '../../../../shared/components/archivo-card/archivo-card.component';
import { ModalConfirmacionComponent } from '../../../../shared/components/modals/modal-confirmacion/modal-confirmacion.component';

@Component({
  selector: 'app-papelera',
  imports: [CommonModule, CarpetaCardComponent, ArchivoCardComponent, ModalConfirmacionComponent],
  templateUrl: './papelera.component.html',
  styleUrl: './papelera.component.css',
})
export class PapeleraComponent implements OnInit{
  private papeleraService = inject(PapeleraService);
  private toastService = inject(ToastService);

  carpetas = signal<any[]>([]);
  archivos = signal<any[]>([]);
  cargando = signal<boolean>(true);
  menuActivoId = signal<string | null>(null);
  mostrarModalConfirmacion = signal<boolean>(false);
  itemAEliminar = signal<{ id: string, tipo: 'archivo' | 'carpeta', nombre: string } | null>(null);

  ngOnInit() {
    this.cargarPapelera();
  }

  cargarPapelera() {
    this.cargando.set(true);
    this.papeleraService.obtenerPapelera().subscribe({
      next: (res) => {
        this.carpetas.set(res.contenido.carpetas);
        this.archivos.set(res.contenido.archivos);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar la papelera');
        this.cargando.set(false);
      }
    });
  }

  toggleMenu(event: Event, id: string) {
    event.stopPropagation();
    this.menuActivoId.set(this.menuActivoId() === id ? null : id);
  }

  cerrarMenus() {
    this.menuActivoId.set(null);
  }

  restaurar(event: Event, id: string, tipo: 'archivo' | 'carpeta') {
    event.stopPropagation();
    this.cerrarMenus();
    
    this.papeleraService.cambiarEstado(id, tipo, 'activo').subscribe({
      next: () => {
        this.toastService.mostrarExito(`${tipo === 'archivo' ? 'Archivo' : 'Carpeta'} restaurado/a`);
        this.cargarPapelera();
      },
      error: (err) => this.toastService.mostrarError(err.error?.mensaje || 'Error al restaurar')
    });
  }

  eliminarDefinitivo(event: Event, id: string, tipo: 'archivo' | 'carpeta', nombre: string) {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemAEliminar.set({ id, tipo, nombre });
    this.mostrarModalConfirmacion.set(true); // Abrimos el modal elegante
  }

  ejecutarEliminacionDefinitiva() {
    const item = this.itemAEliminar();
    if (!item) return;

    this.papeleraService.eliminarDefinitivo(item.id, item.tipo).subscribe({
      next: () => {
        this.toastService.mostrarExito('Elemento eliminado definitivamente');
        this.mostrarModalConfirmacion.set(false);
        this.itemAEliminar.set(null);
        this.cargarPapelera();
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al eliminar');
        this.mostrarModalConfirmacion.set(false);
      }
    });
  }
}
