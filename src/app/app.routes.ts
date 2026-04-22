import { Routes } from '@angular/router';
import { ComentariosComponent } from './comentarios/comentarios'; 
import { LoginComponent } from './components/login/login.component'; 
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './auth-guard'; // 👈 Agrégale el guion '-'
export const routes: Routes = [
    // Si entras a localhost:4200 sin nada, carga los comentarios (Invitado)
    { path: '', component: ComentariosComponent },
    
    // 👇 ESTA ES LA RUTA QUE TE FALTABA: Ahora con seguridad (Guard)
    { 
        path: 'comentarios', 
        component: ComentariosComponent, 
        canActivate: [authGuard] // 🔐 Solo deja pasar si hay sesión activa
    },
    
    // 👇 NUEVO: Ruta del panel de administración premium
    { 
        path: 'dashboard', 
        component: DashboardComponent,
        // canActivate: [authGuard] // Puedes descomentar esto cuando unas el login real
    },
    
    { path: 'login', component: LoginComponent },

    // Comodín: Si escriben cualquier cosa mal, los manda a la comunidad
    { path: '**', redirectTo: '' }
];