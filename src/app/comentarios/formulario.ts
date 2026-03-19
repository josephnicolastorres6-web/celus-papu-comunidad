import { Component, EventEmitter, Output, Input, inject } from '@angular/core'; // 👈 El error estaba aquí, decía @angular/forms
import { FormsModule } from '@angular/forms';
import { ComentariosService } from './service'; 

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onCerrar()">
      <div class="modal-caja" (click)="$event.stopPropagation()">
        <h2>Agregar Reseña para {{ nombreUsuario }}</h2>

        <label>Modelo del celular</label>
        <input type="text" [(ngModel)]="modelo" class="input-modal">

        <label>Calificación</label>
        <select [(ngModel)]="estrellas" class="input-modal">
          <option value="5">⭐⭐⭐⭐⭐ (5 Estrellas)</option>
          <option value="4">⭐⭐⭐⭐ (4 Estrellas)</option>
          <option value="3">⭐⭐⭐ (3 Estrellas)</option>
          <option value="2">⭐⭐ (2 Estrellas)</option>
          <option value="1">⭐ (1 Estrella)</option>
        </select>

        <label>Fecha (Opcional)</label>
        <input type="date" [(ngModel)]="fecha" class="input-modal">

        <label>Opinión</label>
        <textarea [(ngModel)]="texto" class="input-modal area-modal"></textarea>

        <div class="modal-botones">
          <button class="btn-cancelar" (click)="onCerrar()">Cancelar</button>
          <button class="btn-crear" (click)="onGuardar()">Crear</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './comentarios.css'
})
export class FormularioComponent {
  @Input({ required: true }) nombreUsuario!: string;
  @Output() cerrar = new EventEmitter<void>();

  modelo = ''; texto = ''; estrellas = 5; fecha = '';
  private servicio = inject(ComentariosService);

  onCerrar() {
    this.cerrar.emit();
  }

  onGuardar() {
    if (this.modelo && this.texto) {
      this.servicio.agregar({
        id: Date.now(),
        nombre: this.nombreUsuario,
        modelo: this.modelo,
        estrellas: Number(this.estrellas),
        texto: this.texto,
        fecha: this.fecha || new Date().toISOString().split('T')[0],
        avatar: 'avatar3.png'
      });
      this.onCerrar();
    }
  }
}