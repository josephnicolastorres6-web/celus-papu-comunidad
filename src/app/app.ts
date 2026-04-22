import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ComentariosComponent } from "./comentarios/comentarios";
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('celus-papu-comunidad');
}
