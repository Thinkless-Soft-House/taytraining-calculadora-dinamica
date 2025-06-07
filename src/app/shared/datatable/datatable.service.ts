import { inject, Injectable } from '@angular/core';
import { injectQuery } from '@ngneat/query';
import { HttpClient } from '@angular/common/http';
import { map, mergeMap, of, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class DatatableService<T> {
  private endpoint: string = environment.apiUrl;
  source!: string;

  constructor() {}

  createQuery = injectQuery();
  http = inject(HttpClient);

  setSource(source: string): void {
    this.source = source;
  }

  list(
    params: {
      pagination?: any;
      sort?: any;
      filter?: any;
      invalidateCache?: number,
      relations?: string[];
    } = {},
  ) {
    if (!this.source) throw new Error('Source not set');

    //TODO: Create Pagination, Sort and Filter interfaces
    const urlParams = new URLSearchParams();

    // Always set default pagination if not provided
    const page = params.pagination?.page !== undefined ? params.pagination.page : 0;
    const requestedPageSize = params.pagination?.limit || 10;

    // Start with page 1 (API uses 1-based indexing)
    urlParams.set('page', (page + 1).toString());
    urlParams.set('pageSize', requestedPageSize.toString());

    if (params.sort) {
      urlParams.set('orderField', params.sort.active);
      urlParams.set('orderDirection', params.sort.direction);
    }

    if (params.filter && params.filter.length > 0) {
      urlParams.set('filters', JSON.stringify(params.filter)); // Serializa o array de filtros
    }

    if (params.invalidateCache) {
      urlParams.set('t', `${params.invalidateCache}`)
    }

    if (params.relations && params.relations.length > 0) {
      urlParams.set('relations', params.relations.join(',')); // Serializa o array de relações
    }

    // Ajusta a URL dinamicamente: se houver filtro OU ordenação, usa /filter
    let endpoint = this.endpoint + this.source;
    const hasFilter = params.filter && params.filter.length > 0;
    const hasSort = params.sort && params.sort.active;
    if ((hasFilter || hasSort) && !this.source.endsWith('/filter')) {
      if (endpoint.endsWith('/')) {
        endpoint = endpoint.slice(0, -1);
      }
      endpoint += '/filter';
    } else if (!hasFilter && !hasSort && this.source.endsWith('/filter')) {
      endpoint = endpoint.replace(/\/filter$/, '');
    }

    const url = endpoint + '?' + urlParams.toString();

    return {
      result$: this.http.get<any>(url).pipe(
        map(response => {
          // Extract initial data and metadata
          // console.log('[Datable Service] Response from API:', response);

          // Se vier do /filter, espera-se um objeto { data: [], count: N }
          let initialItems: any[] = [];
          let totalItems = 0;
          if (response && Array.isArray(response.data) && typeof response.count === 'number') {
            initialItems = response.data;
            totalItems = response.count;
          } else if (Array.isArray(response)) {
            // Caso padrão (sem filtro)
            initialItems = response;
            totalItems = initialItems.length;
          }

          // Always trim the results to match the requested page size
          // This handles cases where the server returns more items than requested
          const trimmedItems = initialItems.slice(0, requestedPageSize);

          return {
            originalResponse: response, // Store the original response for later use
            success: true,
            message: 'Data retrieved successfully',
            data: {
              data: trimmedItems, // Use trimmed data
              count: totalItems
            },
            timestamp: new Date().toISOString(),
            path: this.source
          };
        }),
        mergeMap(initialResponse => {
          // Since the API returns all data in a single response (array format),
          // we don't need to fetch additional pages
          const initialItems = initialResponse.data.data;

          return of({
            success: initialResponse.success,
            message: initialResponse.message,
            data: {
              data: initialItems,
              count: initialResponse.data.count
            },
            timestamp: initialResponse.timestamp,
            path: initialResponse.path
          });
        })
      ),
      isSuccess: true,
    }
  }
}
