import { Component, Input, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Comentario } from './model'; // 👈 Conecta con tu model.ts
import { ComentariosService } from './service'; // 👈 Conecta con tu service.ts

@Component({
  selector: 'app-tarjeta',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="tarjeta-lila">
      <h3>{{ info.modelo }}</h3>
      <span class="estrellas-tarjeta">{{ '⭐'.repeat(info.estrellas) }}</span>
      <span class="fecha-tarjeta"> • {{ info.fecha | date:'fullDate' }}</span>
      <p class="texto-tarjeta">{{ info.texto }}</p>
      <div class="tarjeta-footer">
        <button class="btn-terminada" (click)="onEliminar()">Eliminar</button>
      </div>
    </div>
  `,
  styleUrl: './comentarios.css' // 👈 Usa tus mismos estilos
})
export class TarjetaComponent {
  @Input({ required: true }) info!: Comentario;
  private servicio = inject(ComentariosService);

  onEliminar() {
    this.servicio.eliminar(this.info.id);
  }
}