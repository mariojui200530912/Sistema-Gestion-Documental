import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../../../core/services/reporte.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-historial-actividad',
  host: { class: 'flex-1 flex flex-col min-h-0 overflow-hidden' },
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-actividad.component.html'
})
export class HistorialActividadComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  usuario = this.authService.usuarioActual;
  cargando = signal<boolean>(true);
  sinPermisos = signal<boolean>(false);

  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');
  usuarioSeleccionadoId = signal<string>('');
  periodoActividad = signal<string>('dia');

  listaUsuarios = signal<any[]>([]);
  datosActividad = signal<any>({ operacionesPorTipo: [], accionesGenerales: [], operacionesPorPeriodo: [], historialFiltrado: [] });

  ngOnInit() {
    if (this.usuario()?.rol !== 'administrador') {
      this.sinPermisos.set(true);
      this.cargando.set(false);
      return;
    }
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.reporteService.obtenerReporteUsuarios().subscribe({
      next: (res) => {
        this.listaUsuarios.set(res.listaUsuarios || []);
        this.aplicarFiltros();
      },
      error: () => this.toastService.mostrarError('Error al cargar usuarios')
    });
  }

  aplicarFiltros() {
    this.cargando.set(true);
    const filtros = {
      usuarioId: this.usuarioSeleccionadoId(),
      fechaInicio: this.filtroFechaInicio(),
      fechaFin: this.filtroFechaFin(),
      periodo: this.periodoActividad()
    };

    this.reporteService.obtenerReporteActividad(filtros).subscribe({
      next: (res) => {
        this.datosActividad.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.mostrarError('Error al cargar la bitácora');
        this.cargando.set(false);
      }
    });
  }

  limpiarFiltros() {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.usuarioSeleccionadoId.set('');
    this.periodoActividad.set('dia');
    this.aplicarFiltros();
  }
}