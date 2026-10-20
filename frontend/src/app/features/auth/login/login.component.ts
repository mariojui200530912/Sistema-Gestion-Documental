import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Definicion del formulario con validaciones
  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required]
  });

  mensajeError = '';
  cargando = false;

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    
    const { correo, contrasena } = this.loginForm.value;

    this.authService.login(correo!, contrasena!).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']); // Redirigimos tras el login exitoso
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.mensaje || 'Error de conexión con el servidor';
      }
    });
  }
}
