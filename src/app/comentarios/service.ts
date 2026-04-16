import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Comentario } from './model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  // 👇 Inyectamos la herramienta para ir a internet (Punto C.2 de la guía)
  private http = inject(HttpClient);

  // 👇 Apuntamos a tu servidor de Node.js en Railway a través de los environment
  private apiUrl = `${environment.apiUrl}/comentarios`;

  private lista = signal<Comentario[]>([]);
  listaComentarios = this.lista.asReadonly();

  // 👇 REQUERIMIENTO C.3: Señal para controlar el estado de carga (Skeleton)
  cargando = signal<boolean>(true);

  constructor() {
    // Al cargar la página, pide las reseñas a MySQL a través de Node.js
    this.cargarDesdeBackend();
  }

  private cargarDesdeBackend() {
    this.cargando.set(true); // Iniciamos la carga
    this.http.get<Comentario[]>(this.apiUrl).subscribe({
      next: (datos) => {
        this.lista.set(datos);
        this.cargando.set(false); // Finaliza la carga con éxito
      },
      error: (err) => {
        console.error('Error cargando datos de MySQL:', err);
        this.cargando.set(false); // Finaliza la carga aunque haya error
      }
    });
  }

  // REQUERIMIENTO B.2: Solo funciona si el Interceptor envía un Token válido
  agregar(nuevo: Comentario) {
    this.http.post<Comentario>(this.apiUrl, nuevo).subscribe({
      next: (comentarioCreado) => {
        this.lista.update(actual => [comentarioCreado, ...actual]);
        console.log('✅ Reseña guardada en MySQL');
      },
      error: (err) => {
        console.error('Error al guardar: ¿Iniciaste sesión?', err);
      }
    });
  }

  // REQUERIMIENTO B.2: Acción protegida por el Interceptor (Punto C.1)
  eliminar(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        // Actualiza la interfaz eliminando el comentario de la señal
        this.lista.update(actual => actual.filter(c => c.id !== id));
        console.log('🗑️ Reseña eliminada de la base de datos');
      },
      error: (err) => {
        console.error('Error al eliminar: Verifica los permisos de Admin', err);
      }
    });
  }
}