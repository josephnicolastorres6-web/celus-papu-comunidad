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

  nombre = signal('');
  email = signal('');
  password = signal('');
  direccion = signal('');
  ciudad = signal('');
  avatarSeleccionado = signal('assets/avatars/ninja.svg');
  cargando = signal(false);

  avatares = [
    'assets/avatars/avatar1.svg',
    'assets/avatars/avatar2.svg',
    'assets/avatars/avatar3.svg',
    'assets/avatars/avatar4.svg',
    'assets/avatars/avatar5.svg',
    'assets/avatars/ninja.svg'
  ];

  seleccionarAvatar(url: string) {
    this.avatarSeleccionado.set(url);
  }

  registrar() {
    if (!this.nombre() || !this.email() || !this.password()) {
      this.toastService.mostrar('Nombre, Email y Password son requeridos.', 'error');
      return;
    }

    const payload = {
      nombre: this.nombre(),
      email: this.email(),
      password: this.password(),
      direccion: this.direccion(),
      ciudad: this.ciudad(),
      avatar: this.avatarSeleccionado()
    };

    this.cargando.set(true);
    this.authService.registroCliente(payload).subscribe({
      next: (res) => {
        this.toastService.mostrar('¡RegistroPapu exitoso! Ahora inicia sesión.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toastService.mostrar(err.error?.error || 'Error al registrarse.', 'error');
      }
    });
  }
}
