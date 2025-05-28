import { inject, Injectable } from '@angular/core';
import { injectQuery } from '@ngneat/query';
import { HttpClient } from '@angular/common/http';
import { map, mergeMap, of, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class DatatableService<T> {
  private endpoint: string = environment.apiUrl;
  source!: string;

  // Mock data for menu
  private mockMenuData = [
    {
      id: 1,
      nomeCardapio: 'Cardápio Saudável',
      descricao: 'Cardápio balanceado com alimentos nutritivos e frescos para uma alimentação saudável',
      faixaCalorica: '1200-1500 kcal',
      status: 'ACTIVE',
      pdf: 'cardapio_saudavel.pdf'
    },
    {
      id: 2,
      nomeCardapio: 'Cardápio Fitness',
      descricao: 'Cardápio rico em proteínas e baixo em carboidratos, ideal para quem pratica exercícios',
      faixaCalorica: '1500-1800 kcal',
      status: 'ACTIVE',
      pdf: 'cardapio_fitness.pdf'
    },
    {
      id: 3,
      nomeCardapio: 'Cardápio Vegetariano',
      descricao: 'Cardápio sem carnes, com foco em vegetais, legumes e proteínas vegetais',
      faixaCalorica: '1000-1300 kcal',
      status: 'INACTIVE',
      pdf: 'cardapio_vegetariano.pdf'
    },
    {
      id: 4,
      nomeCardapio: 'Cardápio Mediterrâneo',
      descricao: 'Baseado na dieta mediterrânea com azeite, peixes, frutas e vegetais',
      faixaCalorica: '1600-2000 kcal',
      status: 'ACTIVE',
      pdf: 'cardapio_mediterraneo.pdf'
    },
    {
      id: 5,
      nomeCardapio: 'Cardápio Low Carb',
      descricao: 'Cardápio com baixo teor de carboidratos, focado em proteínas e gorduras saudáveis',
      faixaCalorica: '1300-1600 kcal',
      status: 'PENDING',
      pdf: 'cardapio_lowcarb.pdf'
    }
  ];

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

    // Handle mock data for menu source
    if (this.source === 'menu') {
      return this.handleMockData(params);
    }

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

    const url = this.endpoint + this.source + '?' + urlParams.toString();

    return {
      result$: this.http.get<any>(url).pipe(
        map(response => {
          // Extract initial data and metadata
          const initialItems = response.data.items || [];
          const meta = response.data.meta || {};
          const totalItems = meta.totalItems || initialItems.length;

          // Always trim the results to match the requested page size
          // This handles cases where the server returns more items than requested
          const trimmedItems = initialItems.slice(0, requestedPageSize);

          return {
            originalResponse: response, // Store the original response for later use
            success: response.success,
            message: response.message,
            data: {
              data: trimmedItems, // Use trimmed data
              count: totalItems
            },
            timestamp: response.timestamp,
            path: response.path
          };
        }),
        mergeMap(initialResponse => {
          // We only need to fetch more pages if we're requesting more items than received
          // and there are more pages available
          const initialItems = initialResponse.data.data;
          const meta = initialResponse.originalResponse.data.meta || {}; // Use stored original response
          const serverPageSize = meta.size || initialItems.length; // Define serverPageSize

          if (
            initialItems.length < requestedPageSize &&
            meta.hasNextPage &&
            initialItems.length < meta.totalItems
          ) {
            // Calculate how many additional pages we need
            const pagesNeeded = Math.min(
              Math.ceil((requestedPageSize - initialItems.length) / serverPageSize),
              meta.totalPages - 1  // Don't request more than available
            );

            // Create an array of additional page requests
            const additionalRequests = [];
            for (let i = 1; i <= pagesNeeded; i++) {
              const additionalUrlParams = new URLSearchParams(urlParams);
              additionalUrlParams.set('page', (page + 1 + i).toString());
              const additionalUrl = this.endpoint + this.source + '?' + additionalUrlParams.toString();
              additionalRequests.push(this.http.get<any>(additionalUrl));
            }

            if (additionalRequests.length === 0) {
              return of({
                success: initialResponse.success,
                message: initialResponse.message,
                data: {
                  data: initialItems,
                  count: meta.totalItems
                },
                timestamp: initialResponse.timestamp,
                path: initialResponse.path
              });
            }

            // Execute all additional requests in parallel
            return forkJoin(additionalRequests).pipe(
              map(additionalResponses => {
                // Merge all items from all responses
                let allItems = [...initialItems];

                for (const additionalResponse of additionalResponses) {
                  const additionalItems = additionalResponse.data.items || [];
                  allItems = [...allItems, ...additionalItems];
                }

                // Trim to the requested page size
                const trimmedItems = allItems.slice(0, requestedPageSize);

                return {
                  success: initialResponse.success,
                  message: initialResponse.message,
                  data: {
                    data: trimmedItems,
                    count: meta.totalItems
                  },
                  timestamp: initialResponse.timestamp,
                  path: initialResponse.path
                };
              })
            );
          }

          // Return the initial response if we don't need more pages
          return of({
            success: initialResponse.success,
            message: initialResponse.message,
            data: {
              data: initialItems,
              count: meta.totalItems || initialItems.length
            },
            timestamp: initialResponse.timestamp,
            path: initialResponse.path
          });
        })
      ),
      isSuccess: true,
    }
  }

  private handleMockData(params: any) {
    let filteredData = [...this.mockMenuData];

    // Apply filters
    if (params.filter && params.filter.length > 0) {
      filteredData = filteredData.filter(item => {
        return params.filter.some((filter: any) => {
          const value = (item as any)[filter.field];
          if (filter.operator === 'like' && value) {
            return value.toLowerCase().includes(filter.value.replace(/%/g, '').toLowerCase());
          }
          return false;
        });
      });
    }

    // Apply sorting
    if (params.sort && params.sort.active) {
      filteredData.sort((a, b) => {
        const aValue = (a as any)[params.sort.active];
        const bValue = (b as any)[params.sort.active];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return params.sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const page = params.pagination?.page || 0;
    const pageSize = params.pagination?.limit || 10;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      result$: of({
        success: true,
        message: 'Data retrieved successfully',
        data: {
          data: paginatedData,
          count: filteredData.length
        },
        timestamp: new Date().toISOString(),
        path: '/menu'
      }),
      isSuccess: true,
    };
  }
}
