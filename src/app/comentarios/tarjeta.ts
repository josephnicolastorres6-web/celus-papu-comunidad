import { Component, Input, inject } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common'; 
import { Comentario } from './model'; 
import { ComentariosService } from './service'; 
// 👇 Importamos el servicio de autenticación para cumplir el punto B.2
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-tarjeta',
  standalone: true,
  imports: [DatePipe, CommonModule],
  template: `
    <div class="tarjeta-lila">
      <h3>{{ info.modelo }}</h3>
      <span class="estrellas-tarjeta">{{ '⭐'.repeat(info.estrellas) }}</span>
      
      <span class="fecha-tarjeta"> • {{ info.fecha | date:'fullDate' }}</span>
      
      <p class="texto-tarjeta">{{ info.texto }}</p>
      
      <div class="tarjeta-footer">
        <button 
          *ngIf="authService.isAdmin()" 
          class="btn-terminada" 
          (click)="onEliminar()">
          Eliminar
        </button>
      </div>
    </div>
  `,
  styleUrl: './comentarios.css'
})
export class TarjetaComponent {
  @Input({ required: true }) info!: Comentario;
  
  private servicio = inject(ComentariosService);
  // 👇 Inyectamos el AuthService para que el HTML sepa si hay sesión activa
  public authService = inject(AuthService);

  onEliminar() {
    if(confirm('¿Seguro que quieres borrar esta reseña, Papu?')) {
      this.servicio.eliminar(this.info.id);
    }
  }
}