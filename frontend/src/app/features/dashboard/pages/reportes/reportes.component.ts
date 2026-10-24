import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReporteService } from '../../../../core/services/reporte.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes',
  host: { class: 'flex-1 flex flex-col min-h-0 overflow-hidden' },
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  usuario = this.authService.usuarioActual;
  cargando = signal<boolean>(true);
  sinPermisos = signal<boolean>(false);

  // Filtros
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');
  usuarioSeleccionadoId = signal<string>('');

  // Listas de datos
  listaUsuarios = signal<any[]>([]);
  datosArchivos = signal<any>({ agrupadosPorTipo: [], totalArchivosRango: 0, archivosEnRango: [], archivosMasActivos: [], carpetasMasLlenas: [], archivosNoCompartidos: [] });
  datosUsuarios = signal<any>({ topArchivos: [], topCompartidores: [] });
  datosComparticion = signal<any>({ archivosMasCompartidos: [], compartidosPorUsuario: [], recibidosPorUsuario: [] });

  // Totales computados
  totalArchivosSistema = computed(() =>
    this.datosArchivos().agrupadosPorTipo.reduce((acc: number, item: any) => acc + item.total, 0)
  );

  espacioTotalSistema = computed(() =>
    this.datosArchivos().agrupadosPorTipo.reduce((acc: number, item: any) => acc + item.tamanoTotal, 0)
  );

  ngOnInit() {
    const rolActual = this.usuario()?.rol;
    if (rolActual !== 'administrador') {
      this.sinPermisos.set(true);
      this.cargando.set(false);
      return;
    }
    this.cargarDatosGenerales();
  }

  cargarDatosGenerales() {
    this.cargando.set(true);

    this.reporteService.obtenerReporteUsuarios().subscribe({
      next: (res) => {
        this.datosUsuarios.set(res);
        this.listaUsuarios.set(res.listaUsuarios || []);
        this.aplicarFiltros();
      },
      error: (err) => {
        if (err.status === 403) this.sinPermisos.set(true);
        else this.toastService.mostrarError('Error al cargar reporte de usuarios');
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.cargando.set(true);
    const fInicio = this.filtroFechaInicio();
    const fFin = this.filtroFechaFin();
    const uId = this.usuarioSeleccionadoId();

    let completadas = 0;
    const verificarFin = () => {
      completadas++;
      if (completadas === 2) this.cargando.set(false);
    };

    // Archivos y almacenamiento (con rango de fechas)
    this.reporteService.obtenerReporteArchivos({ fechaInicio: fInicio, fechaFin: fFin }).subscribe({
      next: (res) => { this.datosArchivos.set(res); verificarFin(); },
      error: () => verificarFin()
    });

    // Compartición (con usuario seleccionado)
    this.reporteService.obtenerReporteComparticion(uId).subscribe({
      next: (res) => { this.datosComparticion.set(res); verificarFin(); },
      error: () => verificarFin()
    });
  }

  limpiarFiltros() {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.usuarioSeleccionadoId.set('');
    this.aplicarFiltros();
  }

  formatearTamano(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  calcularPorcentaje(valor: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((valor / total) * 100);
  }
}