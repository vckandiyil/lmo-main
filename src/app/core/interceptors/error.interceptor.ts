import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.status === 401) {
        errorMessage = 'Unauthorized - please log in';
        // Future: redirect to login
      } else if (error.status === 403) {
        errorMessage = 'Forbidden - access denied';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status >= 500) {
        errorMessage = 'Server error - please try again later';
      }

      console.error(`HTTP Error: ${error.status} - ${errorMessage}`, error);

      return throwError(() => error);
    })
  );
};
