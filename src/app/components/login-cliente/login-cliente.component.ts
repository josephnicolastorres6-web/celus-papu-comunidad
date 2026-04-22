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

  email = signal('');
  password = signal('');
  cargando = signal(false);

  login() {
    if (!this.email() || !this.password()) {
      this.toastService.mostrar('Por favor completa todos los campos.', 'error');
      return;
    }

    this.cargando.set(true);
    this.authService.loginCliente(this.email(), this.password()).subscribe({
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
