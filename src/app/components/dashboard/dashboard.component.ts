import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface UsuarioMock {
  id: number;
  nombre: string;
  rol: string;
  fecha: string;
  avatar?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Estado Reactivo basado estrictamente en Signals (Inicia vacío ahora que leemos BD)
  usuarios = signal<UsuarioMock[]>([]);
  
  cargando = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  
  // Objeto enlazado al formulario SPA
  formUsuario = signal({ nombre: '', rol: 'Usuario', avatar: 'assets/avatars/avatar1.svg' });
  
  // ID del usuario que se está editando (null para modo creación)
  editandoId = signal<number | null>(null);

  // Catálogo visual de avatares dinámicos
  avataresDisponibles = [
    'assets/avatars/avatar1.svg',
    'assets/avatars/avatar2.svg',
    'assets/avatars/avatar3.svg',
    'assets/avatars/avatar4.svg'
  ];

  // Computed Signal: Generado automáticamente cuando 'usuarios' cambia
  totalUsuarios = computed(() => this.usuarios().length);

  // ==========================================
  // ESTADO DEL MEGÁFONO (Muro Público)
  // ==========================================
  textoMegafono = signal<string>('');
  publicandoMegafono = signal<boolean>(false);

  // ==========================================
  // ESTADO DEL TABLERO DE PEDIDOS
  // ==========================================
  listaPedidos = signal<any[]>([]);
  cargandoPedidos = signal<boolean>(false);

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.cargandoPedidos.set(true);
    this.http.get<any[]>(`${this.apiUrl}/admin/pedidos`).subscribe({
      next: (data) => {
        this.listaPedidos.set(data);
        this.cargandoPedidos.set(false);
      },
      error: (err) => {
        console.error('Error cargando Tablero de Pedidos:', err);
        this.cargandoPedidos.set(false);
      }
    });
  }

  marcarEnviado(pedido: any) {
    if(confirm(`¿Confirmas el envío (Despacho) del Pedido #${pedido.id}?`)) {
      this.http.patch(`${this.apiUrl}/pedidos/${pedido.id}/estado`, { estado: 'Enviado' }).subscribe({
        next: () => {
          this.listaPedidos.update(pedidos => pedidos.map(p => 
            p.id === pedido.id ? { ...p, estado: 'Enviado' } : p
          ));
        },
        error: (err) => {
          console.error('Error al enviar:', err);
          alert('Hubo un error al despachar. Intenta nuevamente.');
        }
      });
    }
  }

  toggleDetallePedido(pedido: any) {
    this.listaPedidos.update(pedidos => pedidos.map(p => 
      p.id === pedido.id ? { ...p, expanded: !p.expanded } : p
    ));
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.http.get<UsuarioMock[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.cargando.set(false);
      }
    });
  }

  abrirModal() {
    this.editandoId.set(null); // Asegurar modo creación
    this.formUsuario.set({ nombre: '', rol: 'Usuario', avatar: 'assets/avatars/avatar1.svg' });
    this.modalVisible.set(true);
  }

  editarUsuario(user: UsuarioMock) {
    this.editandoId.set(user.id);
    this.formUsuario.set({
      nombre: user.nombre,
      rol: user.rol,
      avatar: user.avatar || 'assets/avatars/avatar1.svg'
    });
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
    // Reiniciar formulario implícitamente
    this.formUsuario.set({ nombre: '', rol: 'Usuario', avatar: 'assets/avatars/avatar1.svg' });
    this.editandoId.set(null);
  }

  guardarUsuario() {
    const actual = this.formUsuario();
    const idEdicion = this.editandoId();

    if(actual.nombre.trim() === '') {
      alert('¡Debes escribir un nombre para el usuario!');
      return;
    }

    this.cargando.set(true);
    
    if (idEdicion) {
      // MODO EDICIÓN (PUT /usuarios/:id)
      this.http.put(`${this.apiUrl}/usuarios/${idEdicion}`, {
        username: actual.nombre,
        avatar: actual.avatar
      }).subscribe({
        next: () => {
          this.usuarios.update(users => users.map(u => 
            u.id === idEdicion ? { ...u, nombre: actual.nombre, rol: actual.rol, avatar: actual.avatar } : u
          ));
          this.cargando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al editar:', err);
          alert('Error de actualización.');
          this.cargando.set(false);
        }
      });

    } else {
      // MODO CREACIÓN (POST /administradores)
      this.http.post<any>(`${this.apiUrl}/administradores`, {
        username: actual.nombre,
        password: 'password123', 
        rol: actual.rol,
        avatar: actual.avatar
      }).subscribe({
        next: (res) => {
          const nuevoUser: UsuarioMock = {
            id: res.id || Date.now(),
            nombre: actual.nombre,
            rol: actual.rol,
            avatar: actual.avatar,
            fecha: new Date().toISOString().split('T')[0]
          };
          this.usuarios.update(users => [nuevoUser, ...users]);
          this.cargando.set(false);
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al guardar el usuario:', err);
          alert('Ocurrió un error. Puede que ya exista o que no seas Admin Supremo.');
          this.cargando.set(false);
        }
      });
    }
  }
  
  eliminarUsuario(id: number, nombre: string) {
    if(confirm(`¿Estás seguro de eliminar al usuario ${nombre}?`)) {
      this.http.delete(`${this.apiUrl}/usuarios/${id}`).subscribe({
        next: () => {
          this.usuarios.update(users => users.filter(u => u.id !== id));
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          alert('Error al intentar eliminar. Probablemente sesión expirada.');
        }
      });
    }
  }

  publicarEnMuro() {
    const texto = this.textoMegafono().trim();
    if (!texto) {
      alert('¡Escribe algo en el Megáfono!');
      return;
    }
    
    this.publicandoMegafono.set(true);
    
    this.http.post(`${this.apiUrl}/comentarios`, {
      nombre: 'Administrador', // Backend lo sobrescribe o ignora con el JOIN
      modelo: 'Anuncio Oficial', 
      estrellas: 5,
      texto: texto,
      fecha: new Date().toISOString().split('T')[0],
      avatar: 'avatar1.svg' // Obsoleto por el JOIN
    }).subscribe({
      next: () => {
        this.textoMegafono.set('');
        this.publicandoMegafono.set(false);
        alert('¡Publicado en la comunidad exitosamente!');
      },
      error: (err) => {
        console.error('Error publicando:', err);
        alert('Error al publicar. Revisa tus permisos o tu Token JWT.');
        this.publicandoMegafono.set(false);
      }
    });
  }
}
