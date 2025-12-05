import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = `${environment.apiUrl}/storage`;

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo al servidor
   * @param file Archivo a subir (imagen, PDF o Word, máx 10MB)
   * @param folder Carpeta donde guardar el archivo (opcional, por defecto 'documentos')
   * @returns Observable con la URL y path del archivo subido
   */
  uploadFile(file: File, folder: string = 'documentos'): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const params = new HttpParams().set('folder', folder);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, { params });
  }
}

