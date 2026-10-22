import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ModalCompartirComponent } from '../modals/modal-compartir/modal-compartir.component';
import { CommonModule } from '@angular/common';
import { CarpetaCardComponent } from '../carpeta-card/carpeta-card.component';
import { ArchivoCardComponent } from '../archivo-card/archivo-card.component';
import { ModalArchivo } from '../modals/modal-archivo/modal-archivo';
import { ModalCarpeta } from '../modals/modal-carpeta/modal-carpeta';
import { ModalMover } from '../modals/modal-mover/modal-mover';
import { ModalRenombrar } from '../modals/modal-renombrar/modal-renombrar';
import { AuthService } from '../../../core/services/auth.service';
import { ModalConfirmacionComponent } from '../modals/modal-confirmacion/modal-confirmacion.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-explorador-archivos',
  host: { class: 'flex-1 flex flex-col min-h-0 overflow-hidden' },
  imports: [CommonModule,
    FormsModule,
    CarpetaCardComponent,
    ArchivoCardComponent,
    ModalRenombrar,
    ModalMover,
    ModalConfirmacionComponent,
    ModalCompartirComponent,
    ModalArchivo,
    ModalCarpeta
  ],
  templateUrl: './explorador-archivos.component.html',
  styleUrl: './explorador-archivos.component.css',
})
export class ExploradorArchivosComponent {
  private authService = inject(AuthService);
  usuario = this.authService.usuarioActual;

  // --- DATOS RECIBIDOS DEL PADRE ---
  carpetas = input.required<any[]>();
  archivos = input.required<any[]>();
  cargando = input.required<boolean>();
  rutaActual = input<any[]>([]);
  esContextoCompartido = input<boolean>(false);

  // --- EVENTOS ENVIADOS AL PADRE ---
  onAbrirCarpeta = output<any>();
  onNavegarBreadcrumb = output<{ index: number, id: string | null }>();
  onDescargarArchivo = output<any>();
  onRecargarVista = output<void>();

  // --- ESTADO INTERNO ---
  menuActivoId = signal<string | null>(null);
  itemSeleccionado = signal<any>(null);
  tipoItemSeleccionado = signal<'carpeta' | 'archivo' | null>(null);

  // --- SIGNALS PARA BUSCADOR Y FILTROS ---
  terminoBusqueda = signal<string>('');
  filtroTipo = signal<string>('todos'); // 'todos' | 'txt' | 'md'
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');

  mostrarModalArchivo = signal<boolean>(false);
  mostrarModalCarpeta = signal<boolean>(false);
  mostrarModalRenombrar = signal<boolean>(false);
  mostrarModalMover = signal<boolean>(false);
  mostrarModalConfirmacion = signal<boolean>(false);
  mostrarModalCompartir = signal<boolean>(false);

  // --- CONTROL DE MENUS Y PERMISOS ---
  toggleMenu(event: Event, id: string) {
    event.stopPropagation();
    this.menuActivoId.set(this.menuActivoId() === id ? null : id);
  }

  cerrarMenus() {
    this.menuActivoId.set(null);
  }

  puedeEditar(item: any): boolean {
    if (!item) return true;
    const miId = this.usuario()?.id;
    if (!miId) return false;

    const propietarioId = item.propietario_id?._id || item.propietario_id;
    if (propietarioId === miId) return true;

    if (item.accesos && Array.isArray(item.accesos)) {
      return item.accesos.some((acceso: any) => {
        const usuarioAccesoId = acceso.usuario_id?._id || acceso.usuario_id;
        return usuarioAccesoId === miId && acceso.nivel_permiso === 'edicion';
      });
    }
    return false;
  }

  recargarVista() {
    this.onRecargarVista.emit();
  }

  tienesFiltrosActivos = computed(() => {
    return (
      this.terminoBusqueda().trim() !== '' ||
      this.filtroTipo() !== 'todos' ||
      this.filtroFechaInicio() !== '' ||
      this.filtroFechaFin() !== ''
    );
  });

  // --- CARPETAS FILTRADAS
  carpetasFiltradas = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase().trim();
    const fInicio = this.filtroFechaInicio();
    const fFin = this.filtroFechaFin();

    return this.carpetas().filter((carpeta) => {
      const coincideNombre = !busqueda || carpeta.nombre?.toLowerCase().includes(busqueda);
      const coincideFecha = this.cumpleRangoFechas(carpeta.createdAt, fInicio, fFin);
      return coincideNombre && coincideFecha;
    });
  });

  // --- ARCHIVOS FILTRADOS (Por nombre, tipo y rango de fechas) ---
  archivosFiltrados = computed(() => {
    const busqueda = this.terminoBusqueda().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const fInicio = this.filtroFechaInicio();
    const fFin = this.filtroFechaFin();

    return this.archivos().filter((archivo) => {
      // Nombre
      const coincideNombre = !busqueda || archivo.nombre?.toLowerCase().includes(busqueda);

      // Tipo (.txt o .md)
      let coincideTipo = true;
      if (tipo === 'txt') {
        coincideTipo =
          archivo.tipo_archivo === 'text/plain' ||
          archivo.nombre?.toLowerCase().endsWith('.txt');
      } else if (tipo === 'md') {
        coincideTipo =
          archivo.tipo_archivo === 'text/markdown' ||
          archivo.nombre?.toLowerCase().endsWith('.md');
      }

      // Fecha
      const coincideFecha = this.cumpleRangoFechas(archivo.createdAt, fInicio, fFin);

      return coincideNombre && coincideTipo && coincideFecha;
    });
  });

  private cumpleRangoFechas(fechaItem: string, inicioStr: string, finStr: string): boolean {
    if (!inicioStr && !finStr) return true;
    if (!fechaItem) return false;

    const fecha = new Date(fechaItem).getTime();

    if (inicioStr) {
      const inicio = new Date(`${inicioStr}T00:00:00`).getTime();
      if (fecha < inicio) return false;
    }

    if (finStr) {
      const fin = new Date(`${finStr}T23:59:59.999`).getTime();
      if (fecha > fin) return false;
    }

    return true;
  }

  limpiarFiltros() {
    this.terminoBusqueda.set('');
    this.filtroTipo.set('todos');
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
  }

  // --- APERTURA DE MODALES ---
  abrirModalRenombrar(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.mostrarModalRenombrar.set(true);
  }

  abrirModalMover(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.mostrarModalMover.set(true);
  }

  enviarAPapelera(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.mostrarModalConfirmacion.set(true);
  }

  abrirModalCompartir(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.cerrarMenus();
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.mostrarModalCompartir.set(true);
  }

  abrirModalArchivo() {
    this.cerrarMenus();
    this.mostrarModalArchivo.set(true);
  }

  abrirModalCarpeta() {
    this.cerrarMenus();
    this.mostrarModalCarpeta.set(true);
  }
}
