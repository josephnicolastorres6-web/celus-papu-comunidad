import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UsuarioMock {
  id: number;
  nombre: string;
  rol: string;
  fecha: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // Estado Reactivo basado estrictamente en Signals
  usuarios = signal<UsuarioMock[]>([
    { id: 1, nombre: 'Papu Admin', rol: 'Administrador', fecha: '2026-04-20' },
    { id: 2, nombre: 'Miguel Pro', rol: 'VIP', fecha: '2026-04-21' },
    { id: 3, nombre: 'Juan Promedio', rol: 'Usuario', fecha: '2026-04-21' }
  ]);
  
  cargando = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  
  // Objeto enlazado al formulario SPA
  formUsuario = signal({ nombre: '', rol: 'Usuario' });

  // Computed Signal: Generado automáticamente cuando 'usuarios' cambia
  totalUsuarios = computed(() => this.usuarios().length);

  abrirModal() {
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
    // Reiniciar formulario
    this.formUsuario.set({ nombre: '', rol: 'Usuario' });
  }

  guardarUsuario() {
    const actual = this.formUsuario();
    if(actual.nombre.trim() === '') {
      alert('¡Debes escribir un nombre para el usuario!');
      return;
    }

    this.cargando.set(true);
    
    // Simulamos latencia de servidor para exhibir micro-animaciones premium
    setTimeout(() => {
      const nuevoUser = {
        id: Date.now(),
        nombre: actual.nombre,
        rol: actual.rol,
        fecha: new Date().toISOString().split('T')[0]
      };
      
      this.usuarios.update(users => [nuevoUser, ...users]); // Agrega al inicio
      this.cargando.set(false);
      this.cerrarModal();
    }, 600);
  }
  
  eliminarUsuario(id: number, nombre: string) {
    if(confirm(`¿Estás seguro de eliminar al usuario ${nombre}?`)) {
      this.usuarios.update(users => users.filter(u => u.id !== id));
    }
  }
}
