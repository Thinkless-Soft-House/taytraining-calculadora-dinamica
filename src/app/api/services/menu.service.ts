import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseModelService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService extends BaseModelService {
  constructor(http: HttpClient) {
    super('/menu-calculator', http);
  }

  findByCalories(calorias: number) {
    return this.http.get(`${this.path}/find-by-calories/${calorias}`);
  }

  createWithFile(formData: FormData) {
    return this.http.post(`${this.path}`, formData).toPromise();
  }

  updateWithFile(id: number, formData: FormData) {
    return this.http.patch(`${this.path}/single/${id}`, formData).toPromise();
  }

  getFile(id: number) {
    return this.http.get(`${this.path}/file/${id}`, { responseType: 'blob' });
  }
}
