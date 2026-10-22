import { Component, inject, OnInit, signal } from '@angular/core';
import { PapeleraService } from '../../../../core/services/papelera.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { CarpetaCardComponent } from '../../../../shared/components/carpeta-card/carpeta-card.component';
import { ArchivoCardComponent } from '../../../../shared/components/archivo-card/archivo-card.component';
import { ModalEliminarDefinitivoComponent } from '../../../../shared/components/modals/modal-eliminar/modal-eliminar-definitivo.component';

@Component({
  selector: 'app-papelera',
  imports: [CommonModule, CarpetaCardComponent, ArchivoCardComponent, ModalEliminarDefinitivoComponent],
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

  // Estado del Modal Inteligente
  mostrarModalEliminar = signal<boolean>(false);
  itemSeleccionado = signal<any>(null);
  tipoItemSeleccionado = signal<'carpeta' | 'archivo' | null>(null);

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

  abrirModalEliminar(event: Event, item: any, tipo: 'archivo' | 'carpeta') {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.mostrarModalEliminar.set(true);
  }
}
