import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 👇 Usamos la url de Railway almacenada en environment.ts
  private apiUrl = environment.apiUrl; 
  
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals de Sesión de Clientes
  public usuarioActual = signal<any>(null);
  public estaLogueadoCliente = computed(() => !!this.usuarioActual());

  constructor() {
    this.restaurarSesionCliente();
  }

  private restaurarSesionCliente() {
    if (typeof window !== 'undefined' && localStorage.getItem('token_cliente')) {
      const token = localStorage.getItem('token_cliente');
      try {
        const payload = JSON.parse(atob(token!.split('.')[1]));
        this.usuarioActual.set(payload);
      } catch (e) {
        localStorage.removeItem('token_cliente');
      }
    }
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/api/admin/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
        })
      );
  }

  registro(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/api/admin/registrar`, { username, password });
  }

  getToken() { 
    return localStorage.getItem('token'); 
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      // Decodificamos el payload del JWT (base64)
      const payloadString = atob(token.split('.')[1]);
      const payload = JSON.parse(payloadString);
      // 👇 REPARACIÓN: Ahora verificamos el ROL, no solo el nombre 'admin'
      return payload.role === 'admin';
    } catch (e) {
      return false;
    }
  }

  isLoggedIn() { 
    return !!localStorage.getItem('token'); 
  }

  logout() { 
    localStorage.removeItem('token'); 
    this.router.navigate(['/login']);
    console.log('🛡️ Sesión de administrador cerrada.');
  }

  // --- MÓDULO DE CLIENTES & SOCIAL ---
  loginCliente(username: string, pass: string) {
    return this.http.post<any>(`${this.apiUrl}/api/usuarios/login`, { username, password: pass })
      .pipe(
        tap(res => {
          if (res.token) {
            localStorage.setItem('token_cliente', res.token);
            const payload = JSON.parse(atob(res.token.split('.')[1]));
            this.usuarioActual.set(payload);
          }
        })
      );
  }

  registroCliente(datos: any) {
    // Generamos un email ficticio para cumplir con la DB si fuera necesario, 
    // pero el backend ahora lo manejará como opcional.
    return this.http.post<any>(`${this.apiUrl}/api/usuarios/registro`, datos);
  }

  // NUEVO: Registro de Administradores (por Admins)
  registrarAdmin(datos: any) {
    const token = this.getToken();
    return this.http.post<any>(`${this.apiUrl}/api/admin/registrar`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // NUEVO: Actualizar Perfil (Nombre y Avatar)
  actualizarPerfil(nombre: string, avatar: string) {
    const isClient = this.estaLogueadoCliente();
    const token = isClient ? localStorage.getItem('token_cliente') : this.getToken();

    return this.http.put<any>(`${this.apiUrl}/api/usuario/perfil`, { nombre, avatar }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(() => {
        // Actualizamos el signal local
        const current = this.usuarioActual();
        if (current) {
          this.usuarioActual.set({ ...current, nombre, avatar });
          // Si es necesario, regenerar el payload del token o simplemente confiar en el signal
        }
      })
    );
  }

  logoutCliente() {
    localStorage.removeItem('token_cliente');
    this.usuarioActual.set(null);
    this.router.navigate(['/']);
  }
}