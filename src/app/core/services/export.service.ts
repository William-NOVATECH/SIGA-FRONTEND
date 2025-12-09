import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Exporta datos a CSV con formato tabular (filas y columnas)
   * @param data Array de objetos a exportar
   * @param filename Nombre del archivo (sin extensión)
   * @param headers Headers personalizados (opcional) - deben coincidir con las claves de los objetos en data
   */
  exportToCSV(data: any[], filename: string, headers?: string[]): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    // Obtener headers si no se proporcionan
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Crear contenido CSV con formato tabular
    let csvContent = '\uFEFF'; // BOM para UTF-8 (permite que Excel reconozca UTF-8)
    
    // ===== FILA DE HEADERS =====
    const headerRow = csvHeaders.map(header => {
      // Limpiar el header de espacios y caracteres especiales que puedan causar problemas
      const cleanHeader = String(header).trim();
      return this.escapeCSVValue(cleanHeader);
    });
    csvContent += headerRow.join(',') + '\r\n';
    
    // ===== FILAS DE DATOS =====
    data.forEach((row, rowIndex) => {
      const rowValues = csvHeaders.map((header, colIndex) => {
        // Obtener el valor usando la clave exacta del header
        let value: any;
        
        // Primero intentar obtener el valor directamente usando la clave del header
        if (row.hasOwnProperty(header)) {
          value = row[header];
        } else {
          // Si no existe, intentar obtenerlo de forma anidada
          value = this.getNestedValue(row, header);
        }
        
        // Formatear el valor para CSV
        const formattedValue = this.formatValueForCSV(value);
        
        // Escapar el valor para CSV
        return this.escapeCSVValue(formattedValue);
      });
      
      // Agregar la fila completa al contenido CSV
      csvContent += rowValues.join(',') + '\r\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${this.getFormattedDate()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Formatea un valor específicamente para CSV
   */
  private formatValueForCSV(value: any): string {
    // Manejar valores nulos o indefinidos
    if (value === null || value === undefined) {
      return '';
    }
    
    // Manejar fechas
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
    
    // Manejar objetos
    if (typeof value === 'object') {
      // Si es un objeto, intentar obtener propiedades comunes
      if (value.nombre) return String(value.nombre).trim();
      if (value.nombre_carrera) return String(value.nombre_carrera).trim();
      if (value.nombre_departamento) return String(value.nombre_departamento).trim();
      if (value.nombre_asignatura) return String(value.nombre_asignatura).trim();
      if (value.username) return String(value.username).trim();
      // Si no se puede formatear, devolver string vacío
      return '';
    }
    
    // Convertir a string y limpiar espacios
    return String(value).trim();
  }

  /**
   * Escapa un valor para CSV de manera segura
   * Siempre envuelve en comillas para asegurar que cada valor esté en su columna en Excel
   */
  private escapeCSVValue(value: string): string {
    if (value === null || value === undefined || value === '') {
      return '""';
    }
    
    const stringValue = String(value);
    
    // Escapar comillas dobles duplicándolas (estándar CSV)
    const escaped = stringValue.replace(/"/g, '""');
    
    // Siempre envolver en comillas para asegurar que Excel reconozca cada columna correctamente
    // Esto garantiza que valores con comas, espacios o caracteres especiales se mantengan en su columna
    return `"${escaped}"`;
  }

  /**
   * Exporta datos a PDF usando jsPDF
   * @param data Array de objetos a exportar
   * @param filename Nombre del archivo (sin extensión)
   * @param title Título del documento
   * @param columns Columnas a mostrar (opcional)
   */
  async exportToPDF(data: any[], filename: string, title: string, columns?: string[]): Promise<void> {
    try {
      // Importación dinámica de jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      if (!data || data.length === 0) {
        doc.text('No hay datos para exportar', 10, 10);
        doc.save(`${filename}_${this.getFormattedDate()}.pdf`);
        return;
      }

      // Configuración
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const startY = 20;
      let currentY = startY;
      
      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, currentY);
      currentY += 10;
      
      // Fecha de exportación
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exportado el: ${new Date().toLocaleString('es-ES')}`, margin, currentY);
      currentY += 8;
      
      // Obtener columnas
      const cols = columns || Object.keys(data[0]);
      const colWidth = (pageWidth - (margin * 2)) / cols.length;
      
      // Headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      let xPos = margin;
      cols.forEach((col, index) => {
        const text = this.truncateText(col, colWidth - 2);
        doc.text(text, xPos, currentY);
        xPos += colWidth;
      });
      currentY += 7;
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
      currentY += 3;
      
      // Datos
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      data.forEach((row, rowIndex) => {
        // Verificar si necesitamos una nueva página
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = startY;
          
          // Repetir headers en nueva página
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          xPos = margin;
          cols.forEach(col => {
            const text = this.truncateText(col, colWidth - 2);
            doc.text(text, xPos, currentY);
            xPos += colWidth;
          });
          currentY += 7;
          doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
          currentY += 3;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
        }
        
        xPos = margin;
        cols.forEach(col => {
          const value = this.getNestedValue(row, col);
          const text = this.truncateText(this.formatValue(value), colWidth - 2);
          doc.text(text, xPos, currentY);
          xPos += colWidth;
        });
        currentY += 6;
      });
      
      // Guardar PDF
      doc.save(`${filename}_${this.getFormattedDate()}.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      throw new Error('No se pudo exportar a PDF. Asegúrate de que jspdf esté instalado.');
    }
  }

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Formatea un valor para exportación
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
    if (typeof value === 'object') {
      // Si es un objeto, intentar obtener propiedades comunes
      if (value.nombre) return String(value.nombre).trim();
      if (value.nombre_carrera) return String(value.nombre_carrera).trim();
      if (value.nombre_departamento) return String(value.nombre_departamento).trim();
      if (value.nombre_asignatura) return String(value.nombre_asignatura).trim();
      if (value.username) return String(value.username).trim();
      // Si no se puede formatear, devolver string vacío
      return '';
    }
    // Convertir a string y limpiar espacios en blanco al inicio y final
    return String(value).trim();
  }


  /**
   * Trunca texto para que quepa en el ancho especificado
   */
  private truncateText(text: string, maxWidth: number): string {
    const stringValue = String(text || '');
    // Aproximación: 1mm ≈ 0.4 caracteres con fuente de 8pt
    const maxChars = Math.floor(maxWidth * 0.4);
    if (stringValue.length > maxChars) {
      return stringValue.substring(0, maxChars - 3) + '...';
    }
    return stringValue;
  }

  /**
   * Obtiene fecha formateada para nombres de archivo
   */
  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
  }
}

