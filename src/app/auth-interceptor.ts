import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Sacamos el token que guardamos al hacer login
  const token = localStorage.getItem('token');

  // 2. Si hay token, clonamos la petición y le pegamos el "Authorization"
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Si no hay token, la petición sigue su curso normal (como cuando pides los comentarios)
  return next(req);
};