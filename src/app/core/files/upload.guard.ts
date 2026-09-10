import { CanDeactivateFn } from '@angular/router';

export const pendingUploadGuard: CanDeactivateFn<any> = (component) => {
  if (component.uploadStatus && component.uploadStatus() === 'uploading') {
    return confirm('El archivo no se ha subido, si sales la carga se cancelará. ¿Estás seguro de que deseas salir?');
  }
  return true;
};
