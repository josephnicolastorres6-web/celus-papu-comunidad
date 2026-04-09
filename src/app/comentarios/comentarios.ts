import { Component, signal, computed, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { ComentariosService } from './service'; 
import { TarjetaComponent } from './tarjeta'; 
import { FormularioComponent } from './formulario'; 
// 👇 IMPORTANTE: Importamos el servicio de autenticación
import { AuthService } from '../services/auth.service'; 
// 👇 AÑADIMOS EL ROUTERMODULE para que funcionen los botones del HTML
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-comentarios',
  standalone: true,
  // Aquí añadimos RouterModule para quitar el error de [routerLink]
  imports: [CommonModule, TarjetaComponent, FormularioComponent, RouterModule], 
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css'
})
export class ComentariosComponent {
  
  // 👇 Cambiamos a public para que el HTML pueda leer la señal 'cargando' (Requerimiento C.3)
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

  // ACTUALIZACIÓN REQUERIMIENTO B.1: Función para el Logo
  resetearVista() {
    this.usuarioSeleccionado.set('Antonia Céspedes');
    this.mostrarFormulario.set(false);
    console.log('🏠 Regresando al inicio de Celus Papu...');
  }

  seleccionarUsuario(nombre: string) {
    this.usuarioSeleccionado.set(nombre);
    this.mostrarFormulario.set(false);
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }
}