import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private messageService: MessageService) { }

  /**
   * Muestra un mensaje de éxito
   * @param summary Título del mensaje
   * @param detail Detalle del mensaje (opcional)
   */
  showSuccess(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'success',
      summary: summary,
      detail: detail || '',
      life: 3000
    });
  }

  /**
   * Muestra un mensaje de error
   * @param summary Título del mensaje
   * @param detail Detalle del mensaje (opcional)
   */
  showError(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'error',
      summary: summary,
      detail: detail || '',
      life: 5000
    });
  }

  /**
   * Muestra un mensaje de advertencia
   * @param summary Título del mensaje
   * @param detail Detalle del mensaje (opcional)
   */
  showWarn(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: summary,
      detail: detail || '',
      life: 4000
    });
  }

  /**
   * Muestra un mensaje informativo
   * @param summary Título del mensaje
   * @param detail Detalle del mensaje (opcional)
   */
  showInfo(summary: string, detail?: string): void {
    this.messageService.add({
      severity: 'info',
      summary: summary,
      detail: detail || '',
      life: 3000
    });
  }

  /**
   * Limpia todos los mensajes del toast
   */
  clear(): void {
    this.messageService.clear();
  }
}

