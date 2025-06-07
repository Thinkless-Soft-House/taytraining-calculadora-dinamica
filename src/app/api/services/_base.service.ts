import { Observable, firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class BaseModelService {
  path: string;
  constructor(subPath: string, public http: HttpClient) {
    this.path = `${environment.apiUrl}${subPath}`;
  }

  public async request(req: Observable<any>) {
    return firstValueFrom(req);
  }

  // private mockupRequest() {
  //   return this.http
  //     .get('https://binaryjazz.us/wp-json/genrenator/v1/genre/10 ')
  //     .pipe(
  //       map((res: any) => {
  //         const ret = {
  //           items: res.map((item: any, index: number) => {
  //             return {
  //               id: index,
  //               name: item,
  //             };
  //           }),
  //           total: res.length,
  //         };

  //         return ret;
  //       })
  //     );
  // }

  getAll() {
    const req = this.http.get(this.path);
    return this.request(req);
  }

  getByFilter(filter: { [key: string]: string }, relations?: string[]) {
    const rel = relations ? relations.join(',') : '';

    const filterQuery = Object.entries(filter).reduce(
      (acc, [key, value], index) => {
        return Object.entries(filter).length !== index + 1
          ? `${acc}${key}=${value}&`
          : `${acc}${key}=${value}`;
      },
      ''
    );
    const req = this.http.get(
      `${this.path}/filter?${filterQuery}&relations=${rel}`
    );
    return this.request(req);
    // return this.request(this.mockupRequest());
  }

  getById(id: number, relations?: string[]) {
    const rel = relations ? relations.join(',') : '';
    const req = this.http.get(`${this.path}/${id}?relations=${rel}`);
    return this.request(req);
  }

  create(item: any) {
    const req = this.http.post(this.path, item);
    return this.request(req);
  }
  createMany(item: any[]) {
    const req = this.http.post(`${this.path}/many/`, item);
    return this.request(req);
  }

  update(id: number, item: any) {
    const req = this.http.patch(`${this.path}/single/${id}`, item);
    return this.request(req);
  }
  updateMany(id: number, item: any[]) {
    const req = this.http.patch(`${this.path}/many`, item);
    return this.request(req);
  }

  delete(id: number) {
    const req = this.http.delete(`${this.path}/${id}`);
    // console.log('Deleting item with ID:', id);
    // console.log('Request URL:', `${this.path}/${id}`);
    // console.log('Request Method: DELETE');
    return this.request(req);
  }
}
