import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductoFeed } from '../comentarios/comentarios';
import { ToastService } from './toast.service';

export interface CartItem extends ProductoFeed {
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

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

  constructor() {
    // 1. Restaurar memoria local si existe (Persistencia Invocada)
    if (typeof window !== 'undefined' && window.localStorage) {
      const guardado = localStorage.getItem('carrito_papu');
      if (guardado) {
        try {
          const parsed = JSON.parse(guardado);
          if (Array.isArray(parsed)) {
            this.items.set(parsed);
          }
        } catch (e) {
          console.error('Error parseando carrito de localStorage', e);
        }
      }
    }

    // 2. Autoguardado reactivo al detectar cambios en el Signal
    effect(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('carrito_papu', JSON.stringify(this.items()));
      }
    });
  }

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
    
    // Notificación en pantalla
    this.toastService.mostrar(`Has añadido ${producto.nombre} a tu carrito.`, 'success');
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
          this.toastService.mostrar(`¡Pedido #${res.id_pedido} generado con éxito! Nos contactaremos pronto.`, 'success');
          this.items.set([]); // Limpia el carrito
          this.panelVisible.set(false); // Cierra el Offcanvas
        },
        error: (err) => {
          console.error('Error enviando la orden HTTP:', err);
          this.toastService.mostrar('Error al procesar tu pedido. Verifica tu Token.', 'error');
        }
      });
    } else {
      this.toastService.mostrar('Tu carrito está vacío.', 'info');
    }
  }

  togglePanel() {
    this.panelVisible.update(v => !v);
  }
}
