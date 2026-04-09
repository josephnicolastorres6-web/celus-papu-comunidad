import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
// 👇 Inyectamos el Router para cumplir con la redirección del punto A.2
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; 
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() { }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
        })
      );
  }

  // 👇 FUNCIÓN DE REGISTRO AÑADIDA PARA CELUS PAPU
  registro(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/registro`, { username, password });
  }

  getToken() { 
    return localStorage.getItem('token'); 
  }

  // 👇 NUEVA FUNCIÓN: Verifica si el usuario logueado es el admin supremo
  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username === 'admin';
    } catch (e) {
      return false;
    }
  }

  isLoggedIn() { 
    // Retorna true si existe el token, false si no.
    return !!localStorage.getItem('token'); 
  }

  // ACTUALIZACIÓN REQUERIMIENTO A.2: Borrar y Redirigir
  logout() { 
    localStorage.removeItem('token'); 
    // Después de borrar el carnet, lo mandamos al login
    this.router.navigate(['/login']);
    console.log('🚪 Sesión cerrada exitosamente en Celus Papu');
  }
}