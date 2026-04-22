import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductoFeed } from '../../comentarios/comentarios';
import { CarritoService } from '../../services/carrito.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-producto.component.html',
  styleUrl: './detalle-producto.component.css'
})
export class DetalleProductoComponent implements OnInit {
  public carritoService = inject(CarritoService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  productoActual = signal<ProductoFeed | null>(null);
  cargando = signal<boolean>(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalleProducto(id);
    } else {
      this.cargando.set(false);
    }
  }

  cargarDetalleProducto(id: string) {
    this.http.get<ProductoFeed>(`${environment.apiUrl}/productos/${id}`).subscribe({
      next: (producto) => {
        this.productoActual.set(producto);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando el producto:', err);
        this.cargando.set(false);
      }
    });
  }
}
