import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-cliente.component.html',
  styleUrl: './login-cliente.component.css'
})
export class LoginClienteComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Variables normales para ngModel (signals no son compatibles con binding bidireccional directo)
  usuario = '';
  password = '';
  cargando = signal(false);

  login() {
    if (!this.usuario || !this.password) {
      this.toastService.mostrar('Por favor completa todos los campos.', 'error');
      return;
    }

    this.cargando.set(true);
    // Intentamos login con el nombre de usuario
    this.authService.loginCliente(this.usuario, this.password).subscribe({
      next: (res) => {
        this.toastService.mostrar(res.message, 'success');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toastService.mostrar(err.error?.error || 'Credenciales incorrectas.', 'error');
      }
    });
  }
}
