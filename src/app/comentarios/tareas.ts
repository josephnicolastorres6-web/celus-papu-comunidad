import { Component, signal, computed, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { ComentariosService } from './service'; 
import { TarjetaComponent } from './tarjeta'; 
import { FormularioComponent } from './formulario'; 
import { AuthService } from '../services/auth.service'; 
// 👇 IMPORTANTE: Añadimos RouterModule para que funcionen los botones en el HTML
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-comentarios',
  standalone: true,
  // 👇 Añadimos RouterModule aquí para quitar las líneas rojas del HTML
  imports: [CommonModule, TarjetaComponent, FormularioComponent, RouterModule], 
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css'
})
export class TareasComponent {
  
  // 👇 Estas líneas permiten que el HTML use authService.isAdmin()
  public servicio = inject(ComentariosService);
  public authService = inject(AuthService);

  listaComentarios = this.servicio.listaComentarios;

  usuariosUnicos = computed(() => {
    const mapaUsuarios = new Map();
    this.listaComentarios().forEach(c => {
      if (!mapaUsuarios.has(c.nombre)) {
        mapaUsuarios.set(c.nombre, c.avatar);
      }
    });
    return Array.from(mapaUsuarios, ([nombre, avatar]) => ({ nombre, avatar }));
  });

  usuarioSeleccionado = signal<string>('Antonia Céspedes');

  comentariosDelUsuario = computed(() => {
    return this.listaComentarios().filter(c => c.nombre === this.usuarioSeleccionado());
  });

  mostrarFormulario = signal<boolean>(false);

  // Función para el Requerimiento B.1 (Logo)
  resetearVista() {
    this.usuarioSeleccionado.set('Antonia Céspedes');
    this.mostrarFormulario.set(false);
  }

  seleccionarUsuario(nombre: string) {
    this.usuarioSeleccionado.set(nombre);
    this.mostrarFormulario.set(false);
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }
}