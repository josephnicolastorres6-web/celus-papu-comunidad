import { Injectable, signal } from '@angular/core';
import { Comentario } from './model'; 

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private lista = signal<Comentario[]>([]);
  listaComentarios = this.lista.asReadonly();

  constructor() {
    const datos = localStorage.getItem('comentariosPapu');
    if (datos) {
      this.lista.set(JSON.parse(datos));
    } else {
      // 👇 AQUÍ AGREGAMOS TODA LA BANDA DE CELUS PAPU OTRA VEZ
      this.lista.set([
        // Antonia Céspedes
        { id: 1, nombre: 'Antonia Céspedes', modelo: 'iPhone 15 Pro Max', estrellas: 5, texto: 'El equipo llegó melo. 🗿📱 ¡Garantizado!', fecha: '2026-04-14', avatar: 'avatar3.png' },
        { id: 2, nombre: 'Antonia Céspedes', modelo: 'Apple Watch Ultra', estrellas: 5, texto: 'Excelente reloj, sincroniza súper rápido con el iPhone.', fecha: '2026-04-15', avatar: 'avatar1.png' },
        { id: 3, nombre: 'Antonia Céspedes', modelo: 'AirPods Pro 2', estrellas: 5, texto: 'La cancelación de ruido es una locura total.', fecha: '2026-04-16', avatar: 'avatar3.png' },

        // David Mercado
        { id: 4, nombre: 'David Mercado', modelo: 'Samsung S24 Ultra', estrellas: 4, texto: 'La cámara es brutal, el envío a Mosquera tardó solo 1 día.', fecha: '2026-04-16', avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' },
        { id: 5, nombre: 'David Mercado', modelo: 'Galaxy Buds FE', estrellas: 4, texto: 'Suenan bien por el precio, la batería dura bastante.', fecha: '2026-04-18', avatar: 'avatar3.png' },

        // Emilia Torres
        { id: 6, nombre: 'Emilia Torres', modelo: 'Xiaomi Redmi Note 13', estrellas: 5, texto: 'Calidad precio imbatible. Corre todos los juegos sin calentarse.', fecha: '2026-04-17', avatar: 'avatar1.png' },

        // Juan k.
        { id: 7, nombre: 'Juan k.', modelo: 'POCO X6 Pro', estrellas: 5, texto: 'Para jugar va volando a 120fps. Excelente atención.', fecha: '2026-04-10', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
        { id: 8, nombre: 'Juan k.', modelo: 'Cargador Carga Rápida 67W', estrellas: 5, texto: 'Carga el celular en menos de 40 minutos. Original 100%.', fecha: '2026-04-12', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
        { id: 9, nombre: 'Juan k.', modelo: 'Funda Antichoque', estrellas: 4, texto: 'Protege bien, aunque es un poquito gruesa.', fecha: '2026-04-12', avatar: 'avatar2.png' },

        // Mayerli T.
        { id: 10, nombre: 'Mayerli T.', modelo: 'Motorola Edge 40', estrellas: 5, texto: 'Llegó rapidísimo a Funza, la pantalla curva se ve muy elegante.', fecha: '2026-04-19', avatar: 'avatar1.png' },
        { id: 11, nombre: 'Mayerli T.', modelo: 'Aro de luz RGB', estrellas: 5, texto: 'Perfecto para grabar tiktoks, ilumina súper bien el cuarto.', fecha: '2026-04-20', avatar: 'avatar2.png' }
      ]);
      this.guardar(); // Guardamos esta lista inicial de una vez
    }
  }

  agregar(nuevo: Comentario) {
    this.lista.update(actual => [nuevo, ...actual]);
    this.guardar();
  }

  eliminar(id: number) {
    this.lista.update(actual => actual.filter(c => c.id !== id));
    this.guardar();
  }

  private guardar() {
    localStorage.setItem('comentariosPapu', JSON.stringify(this.lista()));
  }
}