import { Injectable } from '@angular/core';
import { ConfirmationService, Confirmation } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {

  constructor(private confirmationService: ConfirmationService) { }

  /**
   * Muestra un diálogo de confirmación para eliminar un registro
   * @param message Mensaje a mostrar (opcional)
   * @param header Título del diálogo (opcional)
   * @param acceptCallback Función a ejecutar cuando se confirma
   * @param rejectCallback Función a ejecutar cuando se cancela (opcional)
   */
  confirmDelete(
    acceptCallback: () => void,
    message: string = '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
    header: string = 'Confirmar eliminación',
    rejectCallback?: () => void
  ): void {
    this.confirmationService.confirm({
      message: message,
      header: header,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: acceptCallback,
      reject: rejectCallback,
      defaultFocus: 'reject'
    });
  }

  /**
   * Muestra un diálogo de confirmación genérico
   * @param config Configuración del diálogo de confirmación
   */
  confirm(config: {
    message: string;
    header?: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptCallback: () => void;
    rejectCallback?: () => void;
    acceptButtonStyleClass?: string;
    rejectButtonStyleClass?: string;
  }): void {
    this.confirmationService.confirm({
      message: config.message,
      header: config.header || 'Confirmar',
      icon: config.icon || 'pi pi-question-circle',
      acceptButtonStyleClass: config.acceptButtonStyleClass || 'p-button-primary',
      rejectButtonStyleClass: config.rejectButtonStyleClass || 'p-button-secondary',
      acceptLabel: config.acceptLabel || 'Aceptar',
      rejectLabel: config.rejectLabel || 'Cancelar',
      accept: config.acceptCallback,
      reject: config.rejectCallback,
      defaultFocus: 'reject'
    });
  }

  /**
   * Muestra un diálogo de confirmación para actualizar un registro
   * @param acceptCallback Función a ejecutar cuando se confirma
   * @param message Mensaje a mostrar (opcional)
   * @param header Título del diálogo (opcional)
   */
  confirmUpdate(
    acceptCallback: () => void,
    message: string = '¿Estás seguro de que deseas guardar los cambios?',
    header: string = 'Confirmar actualización'
  ): void {
    this.confirm({
      message: message,
      header: header,
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      acceptCallback: acceptCallback
    });
  }

  /**
   * Muestra un diálogo de confirmación para una acción crítica
   * @param acceptCallback Función a ejecutar cuando se confirma
   * @param message Mensaje a mostrar (opcional)
   * @param header Título del diálogo (opcional)
   */
  confirmCritical(
    acceptCallback: () => void,
    message: string = 'Esta es una acción crítica. ¿Estás seguro de continuar?',
    header: string = 'Acción crítica'
  ): void {
    this.confirm({
      message: message,
      header: header,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      acceptCallback: acceptCallback
    });
  }
}

