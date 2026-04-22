import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-gestion-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios-admin.component.html',
  styleUrl: './gestion-usuarios-admin.component.css'
})
export class GestionUsuariosAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = environment.apiUrl;

  // Signal para Reactividad Automatizada (RF07)
  listaUsuarios = signal<any[]>([]);
  cargando = signal<boolean>(false);
  
  // Estado del Modal
  modalVisible = signal<boolean>(false);
  editandoId = signal<number | null>(null);
  
  // Formulario enlazado
  formUser = signal({
    nombre: '',
    email: '',
    avatar: 'assets/avatars/ninja.svg'
  });

  avatares = [
    'assets/avatars/avatar1.svg',
    'assets/avatars/avatar2.svg',
    'assets/avatars/avatar3.svg',
    'assets/avatars/avatar4.svg',
    'assets/avatars/avatar5.svg',
    'assets/avatars/ninja.svg'
  ];

  ngOnInit() {
    this.cargarClientes();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  cargarClientes() {
    this.cargando.set(true);
    this.http.get<any[]>(`${this.apiUrl}/admin/usuarios`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.listaUsuarios.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.mostrar('Error al cargar clientes.', 'error');
        this.cargando.set(false);
      }
    });
  }

  abrirModal(user?: any) {
    if (user) {
      this.editandoId.set(user.id);
      this.formUser.set({
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar || 'assets/avatars/ninja.svg'
      });
    } else {
      this.editandoId.set(null);
      this.formUser.set({ nombre: '', email: '', avatar: 'assets/avatars/ninja.svg' });
    }
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
  }

  guardar() {
    const id = this.editandoId();
    const data = this.formUser();

    if (!data.nombre || (!id && !data.email)) {
      this.toastService.mostrar('Completa los campos obligatorios.', 'error');
      return;
    }

    if (id) {
      // ACTUALIZAR (PUT)
      this.http.put(`${this.apiUrl}/admin/usuarios/${id}`, data, { headers: this.getHeaders() }).subscribe({
        next: () => {
          // Actualización directa del Signal (Reactividad Automatizada)
          this.listaUsuarios.update(list => list.map(u => u.id === id ? { ...u, nombre: data.nombre, avatar: data.avatar } : u));
          this.toastService.mostrar('Cliente actualizado con éxito.', 'success');
          this.cerrarModal();
        },
        error: () => this.toastService.mostrar('Error al actualizar.', 'error')
      });
    } else {
      // CREAR (POST)
      this.http.post<any>(`${this.apiUrl}/admin/usuarios`, data, { headers: this.getHeaders() }).subscribe({
        next: (nuevo) => {
          // Inserción directa en el Signal
          this.listaUsuarios.update(list => [nuevo, ...list]);
          this.toastService.mostrar('Cliente creado manualmente.', 'success');
          this.cerrarModal();
        },
        error: () => this.toastService.mostrar('Error al crear cliente.', 'error')
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar a este cliente? Esta acción es irreversible.')) {
      this.http.delete(`${this.apiUrl}/admin/usuarios/${id}`, { headers: this.getHeaders() }).subscribe({
        next: () => {
          // Remoción directa del Signal
          this.listaUsuarios.update(list => list.filter(u => u.id !== id));
          this.toastService.mostrar('Cliente eliminado.', 'success');
        },
        error: () => this.toastService.mostrar('Error al eliminar.', 'error')
      });
    }
  }
}
