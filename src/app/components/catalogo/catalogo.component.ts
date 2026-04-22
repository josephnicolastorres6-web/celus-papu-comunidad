import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CarritoService } from '../../services/carrito.service';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

export interface ProductoFeed {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  especificaciones: string;
  imagen_url: string;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
})
export class CatalogoComponent implements OnInit {
  private http = inject(HttpClient);
  public carritoService = inject(CarritoService);

  catalogo = signal<ProductoFeed[]>([]);
  cargando = signal<boolean>(true);

  ngOnInit() {
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.cargando.set(true);
    this.http.get<ProductoFeed[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (datos) => {
        this.catalogo.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando catálogo:', err);
        this.cargando.set(false);
      }
    });
  }

  agregar(prod: any) {
    this.carritoService.agregarAlCarrito(prod);
  }
}
