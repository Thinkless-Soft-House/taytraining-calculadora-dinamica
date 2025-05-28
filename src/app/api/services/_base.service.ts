import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";
import { injectQuery, injectMutation, injectQueryClient, QueryOptions, MutationOptions } from "@ngneat/query";
import { environment } from "../../../environments/environment";
import { map, Observable } from "rxjs";

interface GetOneResult<T> {
  data: T;
  ok: boolean;
}

export abstract class BaseService<T> {
  protected endpoint: string = environment.apiUrl;

  protected http = inject(HttpClient);
  protected queryClient = injectQueryClient();

  // Funções para criar queries e mutations
  protected createQuery = injectQuery();
  protected createMutation = injectMutation();

  constructor(path: string) {
    this.endpoint = this.endpoint + path;
  }

  getAll(options: any = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      params.set(key, value as any);
    });

    return {
      result$: this.http.get<T[]>(this.endpoint + "?" + params.toString()),
      isSuccess: true,
    };
  }

  getOne(id: number, options: any = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      params.set(key, value as any);
    });

    return {
      result$: this.http.get<GetOneResult<T>>(`${this.endpoint}/${id}?${params.toString()}`),
      isSuccess: true,
    };
  }

  // Método POST (Create One)
  create(newEntity: T) {
    return {
      result$: this.http.post<T>(`${this.endpoint}`, newEntity),
      isSuccess: true,
    };
  }

  // Método POST (Create Many)
  createMany(newEntities: T[]) {
    return {
      result$: this.http.post<T[]>(`${this.endpoint}/many`, newEntities),
      isSuccess: true,
    };
  }

  // Método PUT (Set One)
  set(entity: T) {
    return {
      result$: this.http.put<T>(`${this.endpoint}`, entity),
      isSuccess: true,
    };
  }

  // Método PUT (Set Many)
  setMany(entities: T[]) {
    return {
      result$: this.http.put<T[]>(`${this.endpoint}/many`, entities),
      isSuccess: true,
    };
  }

  // Método PATCH (Update One)
  update(id: number, changes: Partial<T>) {
    return {
      result$: this.http.put<T>(`${this.endpoint}/${id}`, changes),
      isSuccess: true,
    };
  }

  // Método PATCH (Update Many)
  updateMany(entities: Partial<T>[]) {
    return {
      result$: this.http.patch<T[]>(`${this.endpoint}/many`, entities),
      isSuccess: true,
    };
  }

  // Método DELETE (Delete One)
  delete(id: number) {
    return {
      result$: this.http.delete<void>(`${this.endpoint}/${id}`),
      isSuccess: true,
    };
  }

  // Método DELETE (Delete Many)
  deleteMany(ids: number[]) {
    return {
      result$: this.http.request<void>("delete", `${this.endpoint}/many`, {
        body: ids,
      }),
      isSuccess: true,
    };
  }

  // Novo método para fazer consultas via /query endpoint
  query(options: any = {}) {
    let url = `${this.endpoint}/query`;

    // Verifica se options é um array (filtros) ou uma string JSON
    if (Array.isArray(options) || (typeof options === 'string' && options.startsWith('['))) {
      // Adiciona como parâmetro filters
      const filters = typeof options === 'string' ? options : JSON.stringify(options);
      url += `?filters=${encodeURIComponent(filters)}`;
    } else {
      // Continua com o comportamento normal para objetos simples
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        params.set(key, String(value));
      });

      if (params.toString()) {
        url += "?" + params.toString();
      }
    }

    return {
      result$: this.http.get<T[]>(url),
      isSuccess: true,
    };
  }
}
