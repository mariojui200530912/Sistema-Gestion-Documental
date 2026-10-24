import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit{
  private authService = inject(AuthService);
  usuario = this.authService.usuarioActual;
  
  espacioAsignado = computed(() => this.usuario()?.espacioAsignado || (10 * 1024 * 1024));
  espacioUtilizado = computed(() => this.usuario()?.espacioUtilizado || 0);

  porcentajeUso = computed(() => {
    const asignado = this.espacioAsignado();
    const usado = this.espacioUtilizado();
    if (!asignado || asignado <= 0) return 0;
    
    const pct = (usado / asignado) * 100;
    return Math.min(pct, 100);
  });
  
  ngOnInit() {
    // Sincronizamos el espacio real al cargar el dashboard
    this.authService.refrescarUsuarioActual();
  }

  formatearBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }

  esAdmin(): boolean {
    const rol = this.usuario()?.rol;
    return rol === 'administrador';
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
