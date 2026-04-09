import { Routes } from '@angular/router';
import { TareasComponent } from './comentarios/tareas'; 
import { LoginComponent } from './components/login/login.component'; 
import { authGuard } from './auth-guard'; // 👈 Agrégale el guion '-'
export const routes: Routes = [
    // Si entras a localhost:4200 sin nada, carga los comentarios (Invitado)
    { path: '', component: TareasComponent },
    
    // 👇 ESTA ES LA RUTA QUE TE FALTABA: Ahora con seguridad (Guard)
    { 
        path: 'comentarios', 
        component: TareasComponent, 
        canActivate: [authGuard] // 🔐 Solo deja pasar si hay sesión activa
    },
    
    { path: 'login', component: LoginComponent },

    // Comodín: Si escriben cualquier cosa mal, los manda a la comunidad
    { path: '**', redirectTo: '' }
];