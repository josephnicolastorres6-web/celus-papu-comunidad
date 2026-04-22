import { Component, signal, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { FormularioComponent } from './formulario'; 
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service'; 
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
export class ComentariosComponent implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);
  
  feedMuro = signal<ResenaFeed[]>([]);
  cargando = signal<boolean>(true);
  mostrarFormulario = signal<boolean>(false);

  // ESTADO DEL CATÁLOGO
  catalogo = signal<ProductoFeed[]>([]);
  cargandoCatalogo = signal<boolean>(true);

  ngOnInit() {
    this.cargarMuro();
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.cargandoCatalogo.set(true);
    this.http.get<ProductoFeed[]>(`${environment.apiUrl}/productos`).subscribe({
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
        console.error('Error cargando el Muro de la Comunidad:', err);
        this.cargando.set(false);
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario.update(v => !v);
  }
}