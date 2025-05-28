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
}
