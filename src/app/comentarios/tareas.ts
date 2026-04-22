import { Component, signal, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormularioComponent } from './formulario'; 
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service'; 
import { CarritoService } from '../services/carrito.service'; // INYECCIÓN CREADA
import { RouterModule } from '@angular/router'; 
import { environment } from '../../environments/environment';

export interface ResenaFeed {
  id: number;
  texto: string;
  fecha: string;
  estrellas: number;
  username: string;
  avatar: string;
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
  imports: [CommonModule, FormularioComponent, RouterModule], 
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css'
})
export class TareasComponent implements OnInit {
  public authService = inject(AuthService);
  public carritoService = inject(CarritoService); // INYECTADO PÚBLICAMENTE PARA EL HTML
  private http = inject(HttpClient);
  
  feedMuro = signal<ResenaFeed[]>([]);
  cargando = signal<boolean>(true);
  mostrarFormulario = signal<boolean>(false);

  // SIGNALS DEL CATÁLOGO AÑADIDAS (Fallback any[])
  catalogo = signal<any[]>([]);
  cargandoCatalogo = signal<boolean>(false);

  ngOnInit() {
    this.cargarMuro();
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.cargandoCatalogo.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (datos) => {
        this.catalogo.set(datos);
        this.cargandoCatalogo.set(false);
      },
      error: (err) => {
        console.error('Error cargando el catálogo:', err);
        this.cargandoCatalogo.set(false);
      }
    });
  }

  cargarMuro() {
    this.cargando.set(true);
    this.http.get<ResenaFeed[]>(`${environment.apiUrl}/comentarios`).subscribe({
      next: (datos) => {
        this.feedMuro.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando el feed en TareasComponent:', err);
        this.cargando.set(false);
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }
}