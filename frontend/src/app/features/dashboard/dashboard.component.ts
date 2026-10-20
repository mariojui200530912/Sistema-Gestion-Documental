import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CarpetaService } from '../../core/services/carpeta.service';
import { ToastService } from '../../core/services/toast.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArchivoService } from '../../core/services/archivo.service';
import { PapeleraService } from '../../core/services/papelera.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit{
  private authService = inject(AuthService);
  private carpetaService = inject(CarpetaService);
  private archivoService = inject(ArchivoService);
  private papeleraService = inject(PapeleraService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  usuario = this.authService.usuarioActual;
  carpetas = this.carpetaService.carpetas;
  archivos = this.carpetaService.archivos;
  cargando = this.carpetaService.cargando;
  carpetaActualId = this.carpetaService.carpetaActualId;
  rutaActual = this.carpetaService.rutaActual;
  
  mostrarModalCarpeta = signal<boolean>(false);
  mostrarModalArchivo = signal<boolean>(false);
  archivoSeleccionado = signal<File | null>(null);
  subiendoArchivo = signal<boolean>(false);

  // --- SIGNALS PARA EL MENU Y RENOMBRAR ---
  menuActivoId = signal<string | null>(null);
  mostrarModalRenombrar = signal<boolean>(false);
  itemSeleccionado = signal<any>(null); 
  tipoItemSeleccionado = signal<'carpeta' | 'archivo' | null>(null);

  mostrarModalMover = signal<boolean>(false);
  listaCarpetasDestino = signal<any[]>([]); 
  carpetaDestinoSeleccionada = signal<string | null>(null);

  renombrarForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]]
  });

  carpetaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.cargarRaiz();
  }

  cargarRaiz() {
    this.carpetaService.obtenerRaiz().subscribe();
  }

  abrirCarpeta(carpeta: any) {
    this.carpetaService.obtenerContenidoCarpeta(carpeta._id, carpeta.nombre).subscribe();
  }

  abrirModal() {
    this.carpetaForm.reset();
    this.mostrarModalCarpeta.set(true);
  }

  cerrarModal() {
    this.mostrarModalCarpeta.set(false);
  }

  crearCarpeta() {
    if (this.carpetaForm.invalid) return;

    const nombre = this.carpetaForm.value.nombre!;
    const padreId = this.carpetaActualId(); // null si estamos en la raíz, o el ID de la carpeta actual

    this.carpetaService.crearCarpeta(nombre, padreId).subscribe({
      next: () => {
        this.cerrarModal();
        this.toastService.mostrarExito('Carpeta creada correctamente');
      },
      error: (err) => {
        console.error('Error al crear carpeta:', err);
        this.toastService.mostrarError('Error al crear carpeta');
      }
    });
  }

  abrirModalArchivo() {
    this.archivoSeleccionado.set(null);
    this.mostrarModalArchivo.set(true);
  }

  cerrarModalArchivo() {
    this.mostrarModalArchivo.set(false);
    this.archivoSeleccionado.set(null);
  }

  onArchivoSeleccionado(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if(extension === 'txt' || extension === 'md'){
        this.archivoSeleccionado.set(file);
      } else {
        this.archivoSeleccionado.set(null);
        this.toastService.mostrarError("Solo se permiten archivos de texto (.txt) y Markdown (.md)");
        event.target.value = '';
      }
    }
  }

  subirArchivo() {
    const file = this.archivoSeleccionado();
    if (!file) return;

    this.subiendoArchivo.set(true);
    const padreId = this.carpetaActualId();

    this.archivoService.subirArchivo(file, padreId).subscribe({
      next: () => {
        this.subiendoArchivo.set(false);
        this.cerrarModalArchivo();
        this.toastService.mostrarExito('Archivo subido correctamente');
      },
      error: (err) => {
        this.subiendoArchivo.set(false);
        console.error('Error al subir archivo:', err);
        this.toastService.mostrarError(err.error?.mensaje || 'Error al subir el archivo');
      }
    });
  }

  navegarBreadcrumb(index: number, id: string | null) {
    if (id === null) {
      this.cargarRaiz();
    } else {
      // Usamos el id de la ruta para retroceder
      this.carpetaService.obtenerContenidoCarpeta(id, '', index).subscribe();
    }
  }

  descargarArchivo(archivo: any) {
    this.toastService.mostrarExito(`Descargando ${archivo.nombre}...`);
    
    this.archivoService.descargarArchivo(archivo._id).subscribe({
      next: (blob: Blob) => {
        // Creamos una URL temporal para el archivo binario
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre; 
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        this.toastService.mostrarError('Error al descargar el archivo');
      }
    });
  }

  // --- LOGICA DEL MENU ---
  toggleMenu(event: Event, id: string) {
    event.stopPropagation(); // Evita que se dispare el doble clic al abrir el menú
    if (this.menuActivoId() === id) {
      this.menuActivoId.set(null);
    } else {
      this.menuActivoId.set(id);
    }
  }

  cerrarMenus() {
    this.menuActivoId.set(null);
  }

  // --- LÓGICA PARA RENOMBRAR ---
  abrirModalRenombrar(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.menuActivoId.set(null); // Cerramos el menú
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    
    // Si es archivo, le quitamos la extensión para que sea más fácil de editar
    let nombreLimpio = item.nombre;
    if (tipo === 'archivo' && nombreLimpio.includes('.')) {
      nombreLimpio = nombreLimpio.substring(0, nombreLimpio.lastIndexOf('.'));
    }
    
    this.renombrarForm.patchValue({ nombre: nombreLimpio });
    this.mostrarModalRenombrar.set(true);
  }

  cerrarModalRenombrar() {
    this.mostrarModalRenombrar.set(false);
    this.itemSeleccionado.set(null);
    this.tipoItemSeleccionado.set(null);
  }

  guardarNuevoNombre() {
    if (this.renombrarForm.invalid) return;

    const item = this.itemSeleccionado();
    const tipo = this.tipoItemSeleccionado();
    let nuevoNombre = this.renombrarForm.value.nombre!;

    if (tipo === 'archivo') {
      const extension = item.nombre.split('.').pop();
      nuevoNombre = `${nuevoNombre}.${extension}`;
    }

    const request$ = tipo === 'carpeta' 
      ? this.carpetaService.renombrarCarpeta(item._id, nuevoNombre)
      : this.archivoService.renombrarArchivo(item._id, nuevoNombre);

    request$.subscribe({
      next: () => {
        this.toastService.mostrarExito(`${tipo === 'carpeta' ? 'Carpeta' : 'Archivo'} renombrado`);
        this.cerrarModalRenombrar();
        this.recargarContenidoActual();
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al renombrar');
      }
    });
  }

  recargarContenidoActual() {
    // Método auxiliar para recargar la vista actual después de un cambio
    const idPadre = this.carpetaActualId();
    if (idPadre) {
      // Tomamos el nombre del último breadcrumb
      const ruta = this.rutaActual();
      const nombreCarpeta = ruta[ruta.length - 1].nombre;
      this.carpetaService.obtenerContenidoCarpeta(idPadre, nombreCarpeta).subscribe();
    } else {
      this.cargarRaiz();
    }
  }

  abrirModalMover(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.menuActivoId.set(null);
    this.itemSeleccionado.set(item);
    this.tipoItemSeleccionado.set(tipo);
    this.carpetaDestinoSeleccionada.set(null); // Por defecto, apuntar a la raíz
    
    this.carpetaService.obtenerTodasLasCarpetas().subscribe({
      next: (res) => {
        const carpetasValidas = res.carpetas.filter(c => c._id !== item._id);
        this.listaCarpetasDestino.set(carpetasValidas);
      },
      error: () => this.toastService.mostrarError('Error al cargar carpetas destino')
    });
    this.mostrarModalRenombrar.set(false); 
    this.mostrarModalMover.set(true);
  }

  cerrarModalMover() {
    this.mostrarModalMover.set(false);
    this.itemSeleccionado.set(null);
    this.tipoItemSeleccionado.set(null);
  }

  ejecutarMover() {
    const item = this.itemSeleccionado();
    const tipo = this.tipoItemSeleccionado();
    const destinoId = this.carpetaDestinoSeleccionada();

    const request$ = tipo === 'carpeta'
      ? this.carpetaService.moverCarpeta(item._id, destinoId)
      : this.archivoService.moverArchivo(item._id, destinoId);

    request$.subscribe({
      next: () => {
        this.toastService.mostrarExito(`${tipo === 'carpeta' ? 'Carpeta' : 'Archivo'} movido correctamente`);
        this.cerrarModalMover();
        this.recargarContenidoActual();
      },
      error: (err) => {
        this.toastService.mostrarError(err.error?.mensaje || 'Error al mover');
      }
    });
  }

  enviarAPapelera(event: Event, item: any, tipo: 'carpeta' | 'archivo') {
    event.stopPropagation();
    this.menuActivoId.set(null); // Cerramos el menú desplegable

    // Usamos un confirm nativo para evitar borrados accidentales
    if (confirm(`¿Estás seguro de que deseas enviar "${item.nombre}" a la papelera?`)) {
      this.papeleraService.cambiarEstado(item._id, tipo, 'papelera').subscribe({
        next: () => {
          this.toastService.mostrarExito(`${tipo === 'carpeta' ? 'Carpeta' : 'Archivo'} enviado a la papelera`);
          this.recargarContenidoActual(); // Refresca la vista para que desaparezca
        },
        error: (err) => {
          console.error(err);
          this.toastService.mostrarError(err.error?.mensaje || 'Error al enviar a la papelera');
        }
      });
    }
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
