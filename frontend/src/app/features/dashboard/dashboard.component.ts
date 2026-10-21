import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, inject} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent{
  private authService = inject(AuthService);
  usuario = this.authService.usuarioActual;
  
  
  cerrarSesion() {
    this.authService.logout();
  }
}
