import { Injectable, signal, computed } from '@angular/core';
import { ProductoFeed } from '../comentarios/comentarios';

export interface CartItem extends ProductoFeed {
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
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
  
  comprar() {
    if(this.items().length > 0) {
      alert(`✅ ¡Pago exitoso de \$${this.total().toFixed(2)} procesado!\nTus productos llegarán pronto. Gracias por comprar en Celus Papu.`);
      this.items.set([]); // Limpia el carrito
      this.panelVisible.set(false); // Cierra el Offcanvas
    } else {
      alert('Tu carrito está vacío.');
    }
  }

  togglePanel() {
    this.panelVisible.update(v => !v);
  }
}
