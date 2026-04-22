import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductoFeed } from '../comentarios/comentarios';

export interface CartItem extends ProductoFeed {
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private http = inject(HttpClient);

  // Estado reactivo del carrito usando Angular Signals (El Cerebro)
  public items = signal<CartItem[]>([]);
  
  // Control de interfaz offcanvas (Panel lateral modal)
  public panelVisible = signal<boolean>(false);

  // Computeds automáticos para la facturación
  public total = computed(() => {
    return this.items().reduce((suma, item) => suma + (Number(item.precio) * item.cantidad), 0);
  });

  public itemCount = computed(() => {
    return this.items().reduce((count, item) => count + item.cantidad, 0);
  });

  agregarItem(producto: ProductoFeed) {
    this.items.update(currentItems => {
      const match = currentItems.find(i => i.id === producto.id);
      if (match) {
        return currentItems.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      } else {
        return [...currentItems, { ...producto, cantidad: 1 }];
      }
    });
    // Se pidió abrir el panel modal al añadir
    this.panelVisible.set(true); 
  }

  quitarItem(id: number) {
    this.items.update(currentItems => currentItems.filter(i => i.id !== id));
  }
  
  finalizarCompra() {
    if(this.items().length > 0) {
      const payload = {
        total: this.total(),
        items: this.items()
      };

      this.http.post<any>(`${environment.apiUrl}/pedidos`, payload).subscribe({
        next: (res) => {
          alert(`✅ ¡Pedido #${res.id_pedido} generado con éxito!\nPronto nos contactaremos para el pago. Gracias por confiar en Celus Papu.`);
          this.items.set([]); // Limpia el carrito
          this.panelVisible.set(false); // Cierra el Offcanvas
        },
        error: (err) => {
          console.error('Error enviando la orden HTTP:', err);
          alert('Hubo un error al procesar tu pedido. Verifica tu sesión/Token.');
        }
      });
    } else {
      alert('Tu carrito está vacío.');
    }
  }

  togglePanel() {
    this.panelVisible.update(v => !v);
  }
}
