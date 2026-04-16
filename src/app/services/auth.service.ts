import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 👇 CAMBIO CLAVE: Cambiamos localhost por tu link real de Railway
  private apiUrl = 'https://celus-papu-comunidad-production.up.railway.app'; 
  
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

  registro(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/registro`, { username, password });
  }

  getToken() { 
    return localStorage.getItem('token'); 
  }

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
    return !!localStorage.getItem('token'); 
  }

  logout() { 
    localStorage.removeItem('token'); 
    this.router.navigate(['/login']);
    console.log('🚪 Sesión cerrada exitosamente en Celus Papu');
  }
}