import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-cliente.component.html',
  styleUrl: './registro-cliente.component.css'
})
export class RegistroClienteComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Variables normales para binding (reemplazando signals en el form)
  username = '';
  password = '';
  avatarSeleccionado = signal('/avatar1.png');
  cargando = signal(false);

  avatares = [
    '/avatar1.png',
    '/avatar2.png',
    '/avatar3.png',
    '/moai-iphone.png',
    '/moai-samsung.png',
    '/moai-xiaomi.png'
  ];

  seleccionarAvatar(url: string) {
    this.avatarSeleccionado.set(url);
  }

  registrar() {
    if (!this.username || !this.password) {
      this.toastService.mostrar('Nombre y Password son requeridos.', 'error');
      return;
    }

    const payload = {
      username: this.username,
      password: this.password,
      avatar: this.avatarSeleccionado()
    };

    this.cargando.set(true);
    this.authService.registroCliente(payload).subscribe({
      next: (res) => {
        this.toastService.mostrar('¡Registro exitoso! Ahora inicia sesión.', 'success');
        this.router.navigate(['/login-cliente']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toastService.mostrar(err.error?.error || 'Error al registrarse.', 'error');
      }
    });
  }
}
