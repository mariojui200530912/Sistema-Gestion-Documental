import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  let requestClonada = req;
  if(token){
    requestClonada = req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(requestClonada).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        // Si el backend rechaza el token o la cuenta está inactiva, limpiar y expulsar
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
