import { ComentariosComponent } from './comentarios'; // <--- Importalo

({
  selector: 'app-root',
  standalone: true,
  imports: [ComentariosComponent], // <--- Ponlo aquí
  template: '<app-comentarios></app-comentarios>', // <--- Pon esto para que solo se vea tu página
})
export class AppComponent {}