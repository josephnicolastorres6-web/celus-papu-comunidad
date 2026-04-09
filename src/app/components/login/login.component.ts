import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; 
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Añadimos ActivatedRoute

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  
  // 👇 Título dinámico para diferenciar entre Usuario y Admin
  tituloFormulario = 'Bienvenido a Celus Papu';
  modoRegistro = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute // Inyectamos la ruta activa
  ) {}

  ngOnInit() {
    // Escuchamos si vienen de los botones de la pantalla principal
    this.route.queryParams.subscribe(params => {
      const rol = params['rol'];
      if (rol === 'admin') {
        this.tituloFormulario = 'Acceso Restringido: Administrador 🔐';
        this.modoRegistro = false; // El admin no se registra por aquí
      } else {
        this.tituloFormulario = 'Inicia Sesión como Papu 👤';
      }
    });
  }

  // Función para cambiar entre Login y Registro
  toggleModo() {
    this.modoRegistro = !this.modoRegistro;
    this.error = '';
    this.username = '';
    this.password = '';
    this.tituloFormulario = this.modoRegistro ? 'Crea tu Cuenta en Celus Papu' : 'Inicia Sesión como Papu 👤';
  }

  onLogin(event: Event) {
    event.preventDefault();

    // Si estamos en modo registro
    if (this.modoRegistro) {
      this.authService.registro(this.username, this.password).subscribe({
        next: () => {
          alert('¡Usuario creado con éxito! Ahora puedes iniciar sesión.');
          this.modoRegistro = false;
          this.tituloFormulario = 'Inicia Sesión como Papu 👤';
        },
        error: (error: any) => {
          this.error = error.error?.error || 'Error al registrar usuario';
        }
      });
    } else {
      // Login normal
      this.authService.login(this.username, this.password).subscribe({
        next: () => {
          alert('¡Bienvenido! Acceso concedido a la comunidad.');
          this.router.navigate(['/comentarios']); 
        },
        error: (error: any) => {
          this.error = 'Usuario o contraseña incorrectos';
        }
      });
    }
  }
}