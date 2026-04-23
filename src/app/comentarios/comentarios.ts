import { Component, signal, OnInit, inject, computed } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service'; 
import { CarritoService } from '../services/carrito.service';
import { RouterModule, Router } from '@angular/router'; 
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';

export interface ResenaFeed {
  id: number;
  texto: string;
  fecha: string;
  estrellas: number;
  username: string;
  avatar: string;
  modelo?: string;
  usuario_id?: number;
}

export interface Miembro {
  id: number;
  username: string;
  avatar: string;
  ultima_conexion: string | null;
  rol: string;
}

export interface ProductoFeed {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  especificaciones: string;
  imagen_url: string;
}

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], 
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css'
})
export class ComentariosComponent implements OnInit {
  public authService = inject(AuthService);
  public carritoService = inject(CarritoService);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  feedMuro = signal<ResenaFeed[]>([]);
  miembros = signal<Miembro[]>([]);
  cargando = signal<boolean>(true);

  // Estados de Modales
  showPerfilModal = signal<boolean>(false);
  showAdminModal = signal<boolean>(false);
  showNuevoMensajeModal = signal<boolean>(false);

  // Data temporal para formularios
  perfilForm = { nombre: '', avatar: '' };
  adminForm = { username: '', password: '', avatar: 'assets/avatars/avatar1.svg' };
  mensajeForm = { texto: '', modelo: '', estrellas: 5 };

  avatares = [
    '/avatar1.png',
    '/avatar2.png',
    '/avatar3.png',
    '/moai-iphone.png',
    '/moai-samsung.png',
    '/moai-xiaomi.png'
  ];

  avataresAdmin = [
    '/avatar1.png',
    '/avatar2.png',
    '/avatar3.png',
    '/logo1.jpg',
    '/moai-poco.png'
  ];

  ngOnInit() {
    this.cargarMuro();
    this.cargarMiembros();
    
    // Precargar datos de perfil si está logueado
    const user = this.authService.usuarioActual();
    if (user) {
      this.perfilForm.nombre = user.nombre || user.username;
      this.perfilForm.avatar = user.avatar;
    }
  }

  cargarMiembros() {
    this.http.get<Miembro[]>(`${environment.apiUrl}/api/miembros`).subscribe({
      next: (data) => this.miembros.set(data),
      error: (err) => console.error('Error miembros:', err)
    });
  }

  cargarMuro() {
    this.cargando.set(true);
    const token = localStorage.getItem('token_cliente') || localStorage.getItem('token');
    
    if (!token) {
      this.cargando.set(false);
      return;
    }

    this.http.get<ResenaFeed[]>(`${environment.apiUrl}/comentarios`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (datos) => {
        this.feedMuro.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando el Muro:', err);
        this.cargando.set(false);
      }
    });
  }

  enviarMensaje() {
    if (!this.mensajeForm.texto) return;
    
    const user = this.authService.usuarioActual();
    const token = localStorage.getItem('token_cliente') || localStorage.getItem('token');
    
    const body = {
      ...this.mensajeForm,
      nombre: user.nombre || user.username,
      avatar: user.avatar
    };

    this.http.post(`${environment.apiUrl}/comentarios`, body, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(() => {
      this.cargarMuro();
      this.showNuevoMensajeModal.set(false);
      this.mensajeForm = { texto: '', modelo: '', estrellas: 5 };
    });
  }

  eliminarMensaje(id: number) {
    const token = localStorage.getItem('token'); // Solo admin tiene 'token'
    this.http.delete(`${environment.apiUrl}/comentarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(() => this.cargarMuro());
  }

  actualizarPerfil() {
    this.authService.actualizarPerfil(this.perfilForm.nombre, this.perfilForm.avatar).subscribe({
      next: () => {
        this.showPerfilModal.set(false);
        this.cargarMuro();
      }
    });
  }

  registrarAdmin() {
    this.authService.registrarAdmin(this.adminForm).subscribe({
      next: () => {
        this.showAdminModal.set(false);
        this.adminForm = { username: '', password: '', avatar: 'assets/avatars/avatar1.svg' };
        this.cargarMiembros();
      },
      error: (err) => alert(err.error.error || 'Error al registrar admin')
    });
  }

  logout() {
    if (this.authService.estaLogueadoCliente()) {
      this.authService.logoutCliente();
    } else {
      this.authService.logout();
    }
  }

  irALoginCliente() {
    console.log('Botón de cliente activado');
    this.router.navigate(['/login']);
  }

  irALoginAdmin() {
    console.log('Botón de admin activado');
    this.router.navigate(['/admin-login']);
  }

  calcularTiempo(fechaStr: string | null): string {
    if (!fechaStr) return 'Offline';
    const ahora = new Date();
    const fecha = new Date(fechaStr);
    const difMs = ahora.getTime() - fecha.getTime();
    const difMin = Math.floor(difMs / 60000);
    
    if (difMin < 1) return 'Activo ahora';
    if (difMin < 60) return `Hace ${difMin} min`;
    const difHoras = Math.floor(difMin / 60);
    if (difHoras < 24) return `Hace ${difHoras} h`;
    return 'Hace mucho';
  }
}