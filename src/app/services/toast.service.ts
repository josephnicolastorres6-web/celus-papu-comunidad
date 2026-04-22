import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  texto: string;
  tipo: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private idCounter = 0;

  mostrar(texto: string, tipo: 'success' | 'error' | 'info' = 'success') {
    const id = this.idCounter++;
    this.toasts.update(current => [...current, { id, texto, tipo }]);
    
    // Auto remover después de 4 segundos
    setTimeout(() => {
      this.remover(id);
    }, 4000);
  }

  remover(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
