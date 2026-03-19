import { Component, signal, computed, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { ComentariosService } from './service'; // 👈 Conecta con tu service.ts
import { TarjetaComponent } from './tarjeta'; // 👈 Conecta con tu tarjeta.ts
import { FormularioComponent } from './formulario'; // 👈 Conecta con tu formulario.ts

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, TarjetaComponent, FormularioComponent], // 👈 Importa tus componentes aquí
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css'
})
export class ComentariosComponent {
  
  // 👇 INYECTAMOS EL SERVICIO (Página 72 del PDF)
  private servicio = inject(ComentariosService);

  // 👇 LA LISTA AHORA VIENE DEL SERVICIO
  listaComentarios = this.servicio.listaComentarios;

  // Mantenemos la lógica de usuarios intacta
  usuariosUnicos = computed(() => {
    const mapaUsuarios = new Map();
    this.listaComentarios().forEach(c => {
      if (!mapaUsuarios.has(c.nombre)) {
        mapaUsuarios.set(c.nombre, c.avatar);
      }
    });
    return Array.from(mapaUsuarios, ([nombre, avatar]) => ({ nombre, avatar }));
  });

  // Empezamos con Antonia seleccionada
  usuarioSeleccionado = signal<string>('Antonia Céspedes');

  comentariosDelUsuario = computed(() => {
    return this.listaComentarios().filter(c => c.nombre === this.usuarioSeleccionado());
  });

  mostrarFormulario = signal<boolean>(false);

  seleccionarUsuario(nombre: string) {
    this.usuarioSeleccionado.set(nombre);
    this.mostrarFormulario.set(false);
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }


}