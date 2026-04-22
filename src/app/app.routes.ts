import { Routes } from '@angular/router';
import { ComentariosComponent } from './comentarios/comentarios'; 
import { LoginComponent } from './components/login/login.component'; 
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DetalleProductoComponent } from './components/detalle-producto/detalle-producto.component';
import { LoginClienteComponent } from './components/login-cliente/login-cliente.component';
import { RegistroClienteComponent } from './components/registro-cliente/registro-cliente.component';
import { authGuard } from './auth-guard'; // 👈 Agrégale el guion '-'
export const routes: Routes = [
    // Si entras a localhost:4200 sin nada, carga los comentarios (Invitado)
    { path: '', component: ComentariosComponent },
    
    // Auth Clientes (STANDALONE PAGES)
    { path: 'login', component: LoginClienteComponent },
    { path: 'registro', component: RegistroClienteComponent },
    
    // Auth Administrador (Original)
    { path: 'admin-login', component: LoginComponent },

    // Comodín: Si escriben cualquier cosa mal, los manda a la comunidad
    { path: '**', redirectTo: '' }
];