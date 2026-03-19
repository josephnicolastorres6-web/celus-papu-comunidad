import { Component, signal, computed, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { ComentariosService } from './service'; // 👈 Tu servicio
import { TarjetaComponent } from './tarjeta'; // 👈 Tu componente de tarjeta
import { FormularioComponent } from './formulario'; // 👈 Tu componente de formulario

@Component({
  selector: 'app-tareas', // 👈 Así se llama ahora para el HTML
  standalone: true,
  imports: [CommonModule, TarjetaComponent, FormularioComponent], 
  templateUrl: './comentarios.html', // 👈 Sigue usando tu mismo HTML de siempre
  styleUrl: './comentarios.css'     // 👈 Sigue usando tu mismo CSS de siempre
})
export class TareasComponent {
  
  // 1. Inyectamos el servicio (Página 67 del PDF)
  private servicio = inject(ComentariosService);

  // 2. Obtenemos los datos del servicio
  listaComentarios = this.servicio.listaComentarios;

  // 3. Estado para el usuario seleccionado
  usuarioSeleccionado = signal<string>('Antonia Céspedes');

  // 4. Estado para mostrar/ocultar el formulario hijo
  mostrarFormulario = signal<boolean>(false);

  // 5. Filtrado de comentarios (Lógica de la página 60 del PDF)
  comentariosDelUsuario = computed(() => {
    return this.listaComentarios().filter(c => c.nombre === this.usuarioSeleccionado());
  });

  // 6. Lista de usuarios para el menú lateral
  usuariosUnicos = computed(() => {
    const mapaUsuarios = new Map();
    this.listaComentarios().forEach(c => {
      if (!mapaUsuarios.has(c.nombre)) {
        mapaUsuarios.set(c.nombre, c.avatar);
      }
    });
    return Array.from(mapaUsuarios, ([nombre, avatar]) => ({ nombre, avatar }));
  });

  // 7. Funciones de control
  seleccionarUsuario(nombre: string) {
    this.usuarioSeleccionado.set(nombre);
    this.mostrarFormulario.set(false);
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }
}