// Basado en la estructura de la página 28 del PDF "GESTOR DE TAREAS"
export interface Comentario {
  id: number;      // Para identificar cada comentario de forma única
  nombre: string;  // El nombre del cliente
  modelo: string;  // El celular que compró
  estrellas: number; // Su calificación
  texto: string;   // Lo que escribió
  fecha: string;   // Cuándo lo puso
  avatar: string; 
}