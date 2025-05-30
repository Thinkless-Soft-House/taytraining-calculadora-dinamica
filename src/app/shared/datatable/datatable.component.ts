import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnDestroy,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DatatableService } from './datatable.service';
import {
  BehaviorSubject,
  combineLatest,
  of,
  startWith,
  debounceTime,
  tap,
} from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


import { CustomMatPaginatorIntl } from '../custom-paginator/custom-paginator.component';
import { Filter } from '../../api/model/datatable.model';

@Component({
  selector: 'my-datatable',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  providers: [DatatableService,
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }
  ],
  templateUrl: './datatable.component.html',
  styleUrl: './datatable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableComponent<T> implements OnInit, AfterViewInit, OnDestroy {
  isLoading = false;
  TypeColumn = TypeColumn;
  isMobile: boolean = false;
  mobileColsIndices: number[] = [];
  displayedCols: string[] = [];
  totalCount: number = 0; // Add this property

  @Input() settings!: DataTableSettings;

  @ViewChild(MatPaginator, { static: false }) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  datatableSourceService: DatatableService<T> = inject(DatatableService<T>);
  datasource: MatTableDataSource<T> = new MatTableDataSource<T>([]);

  cols: string[] = [];
  textFilter: BehaviorSubject<string> = new BehaviorSubject<string>('');
  previousFilter: string = '';

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkIfMobile();
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.datatableSourceService.setSource(this.settings.source);
    this.handleColumns();
    this.checkIfMobile();
  }

  ngAfterViewInit(): void {
    this.listenChanges();
  }

  async listenChanges() {
    const p$ =
      this.settings.paginationConfiguration && this.paginator
        ? this.paginator.page.pipe(
          tap(() => {
            this.isLoading = true;
            this.cdr.markForCheck();
          }),
          startWith({
            pageIndex: this.paginator.pageIndex,
            pageSize: this.paginator.pageSize,
            length: this.paginator.length,
          } as PageEvent),
        )
        : of(null);

    const s$ =
      this.settings.sortConfiguration && this.sort
        ? this.sort.sortChange.pipe(
          tap(() => {
            this.isLoading = true;
            this.cdr.markForCheck();
          }),
          startWith({
            active: this.sort.active || '',
            direction: this.sort.direction || '',
          } as Sort),
        )
        : of(null);

    const f$ = this.settings.filterConfiguration
      ? this.textFilter
        .asObservable()
        .pipe(
          tap(() => {
            // Only trigger loading if value actually changed
            if (this.textFilter.getValue() !== this.previousFilter) {
              this.isLoading = true;
              this.cdr.markForCheck();
              this.previousFilter = this.textFilter.getValue();
            }
          }),
          debounceTime(500),
          startWith(this.textFilter.getValue())
        )
      : of(null);

    const fu$ = this.settings.forceUpdate$
      ? this.settings.forceUpdate$.pipe(
          tap(() => {
            this.isLoading = true;
            this.cdr.markForCheck();
          })
        )
      : new BehaviorSubject<number>(0);

    // Set initial loading state when component first loads
    this.isLoading = true;
    this.cdr.markForCheck();

    combineLatest([p$, s$, f$, fu$])
      .subscribe({
        next: async ([page, sort, filter, fu]) => {
          try {
            await this.changeDatatable(page, sort, filter, fu);
          } catch (err) {
            console.error(err);
            this.datasource.data = [];
            if (this.paginator) this.paginator.length = 0;
          } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error(err);
          this.datasource.data = [];
          if (this.paginator) this.paginator.length = 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  async changeDatatable(
    page: PageEvent | null,
    sort: Sort | null,
    filter: string | null,
    forceUpdate?: number,
  ) {
    // Remove all mock data handling logic - use only service-based logic
    let filters: Filter[] = [];
    if (this.settings.filters) {
      filters.push(...this.settings.filters);
    }

    if (filter && this.settings.filterConfiguration?.target) {
      const textFilters: Filter[] = this.settings.filterConfiguration.target.map(
        (target) => ({
          field: target,
          operator: 'like',
          value: `%${filter}%`,
        })
      );
      filters = [...filters, ...textFilters];
    }

    // Use the paginator's current values rather than potentially stale cached values
    const pageIndex = page?.pageIndex ?? this.paginator?.pageIndex ?? 0;
    const pageSize = page?.pageSize ?? this.paginator?.pageSize ??
      this.settings.paginationConfiguration?.pageSize ?? 10;

    const sortActive =
      sort?.active || this.settings.sortConfiguration?.active || '';
    let sortField = sortActive;
    // Mapeia a coluna calorieRange para minCalories para ordenação
    if (sortField === 'calorieRange') {
      sortField = 'minCalories';
    }
    const sortDirection =
      sort?.direction || this.settings.sortConfiguration?.direction || '';

    try {
      const items = this.datatableSourceService.list({
        pagination: this.settings.paginationConfiguration
          ? { page: pageIndex, limit: pageSize }
          : undefined,
        sort: this.settings.sortConfiguration
          ? { active: sortField, direction: sortDirection }
          : undefined,
        filter: filters.length > 0
          ? filters
          : undefined,
        invalidateCache: forceUpdate ?? undefined,
        relations: this.settings.relations ?? [],
      });

      items.result$.subscribe({
        next: (res) => {
          if (res) {
            this.datasource.data = (res as any).data.data as T[];
            this.totalCount = (res as any).data.count;

            if (this.paginator && this.settings.paginationConfiguration) {
              this.paginator.length = (res as any).data.count;
            }
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.datasource.data = [];
          this.totalCount = 0;
          if (this.paginator) this.paginator.length = 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    } catch (error) {
      console.error(error);
      this.totalCount = 0;
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  checkIfMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;

    // console.log('estou aqui - DATATABLE MOBILE CHECK:', this.isMobile, 'window width:', window.innerWidth);

    if (wasMobile !== this.isMobile) {
      this.updateDisplayedColumns();
      // console.log('estou aqui - DATATABLE COLUMNS UPDATED FOR MOBILE:', this.isMobile);
    }
  }

  updateDisplayedColumns(): void {
    if (this.isMobile && this.settings.mobileConfiguration) {
      this.displayedCols = this.settings.mobileConfiguration.columnNames;
    } else {
      this.displayedCols = this.cols;
    }
    this.cdr.markForCheck();
  }

  handleColumns() {
    this.cols = this.settings.columns.map((col) => col.name);
    this.updateDisplayedColumns();
  }

  handleFilter(event: any) {
    this.textFilter.next(event.target.value);
  }

  get visibleColumnCount(): number {
    return this.settings.columns.filter(column => column.display !== false).length;
  }

  getStyle(value: string, styles?: { [key: string]: string }): string {
    // Return the provided style if available
    if (styles && styles[value]) {
      return styles[value];
    }

    // Default styles for common status values
    const defaultStyles: { [key: string]: string } = {
      'ACTIVE': 'status-active',
      'INACTIVE': 'status-inactive',
      'PENDING': 'status-pending',
      'SUSPENDED': 'status-suspended',
      'BLOCKED': 'status-blocked',

      // Status values converted to lowercase for case-insensitive matching
      'active': 'status-active',
      'inactive': 'status-inactive',
      'pending': 'status-pending',
      'suspended': 'status-suspended',
      'blocked': 'status-blocked',

      // Common boolean representations
      'true': 'status-active',
      'false': 'status-inactive',
    };

    return defaultStyles[value] || '';
  }

  getPropertyValue(obj: any, key: string): any {
    return obj && key ? obj[key] : '';
  }

  /**
   * Returns CSS classes for column width based on column type and name
   */
  getColumnClass(column: any): string {
    // Base class for all columns
    let classes = 'column-fit-content';

    // Special handling for certain column names
    if (column.name === 'id') {
      return 'column-id';
    }

    if (column.name === 'actions') {
      return 'column-actions';
    }

    // Class based on column type
    switch(column.type) {
      case TypeColumn.ENUM:
        classes = 'column-status';
        break;
      case TypeColumn.DATE:
        classes = 'column-date';
        break;
      case TypeColumn.STRING:
      case TypeColumn.LONGSTRING:
      case TypeColumn.TRANSFORMTEXT:
        classes = 'column-text';
        break;
      case TypeColumn.ACTIONS:
        classes = 'column-actions';
        break;
      default:
        // Use the base class for other types
        break;
    }

    return classes;
  }

  ngOnDestroy(): void { }

  // Add this method to manually handle page size changes if the default events aren't working
  handlePageEvent(event: PageEvent): void {
    if (this.paginator) {
      // Set loading state explicitly for direct page events
      this.isLoading = true;
      this.cdr.markForCheck();

      // Ensure the paginator's values are updated
      this.paginator.pageIndex = event.pageIndex;
      this.paginator.pageSize = event.pageSize;

      // Force the data refresh with new pagination
      this.changeDatatable(event, this.sort ? {
        active: this.sort.active,
        direction: this.sort.direction
      } : null, this.textFilter.getValue());
    }
  }
}

export interface DataTableSettings {
  columns: Column[];
  source: string;
  relations?: string[];
  paginationConfiguration?: PaginationConfiguration;
  sortConfiguration?: SortConfiguration;
  filterConfiguration?: FilterConfiguration;
  mobileConfiguration?: MobileConfiguration;
  mockData?: any[];
  titleConfiguration?: TitleConfiguration; // Add this property

  forceUpdate$?: BehaviorSubject<number>;

  events: Event[];
  filters: Filter[];
}

interface Column {
  name: string;
  label: string;
  type: TypeColumn;
  attr?: string;
  display?: boolean;
  sortable?: boolean;
  events?: Event[];
  extra?: any;
  transform?: (row: any) => string;
}

interface PaginationConfiguration {
  pageSize?: number;
  pageSizeOptions?: number[];
  ariaLabel?: string;
}

interface SortConfiguration {
  active?: string;
  direction?: 'asc' | 'desc';
}

interface FilterConfiguration {
  value?: string;
  target?: string[];
}

export interface MobileConfiguration {
  columnNames: string[];
}

interface Event {
  name: string;
  label?: string;
  icon?: string;
  handler: Function;
  hideIf?: (row: any) => boolean;
  tooltip: string;
}

interface TitleConfiguration {
  title: string;
  singularLabel: string;
  pluralLabel: string;
}

export enum TypeColumn {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  ACTIONS = 'actions',
  ENUM = 'enum',
  LONGSTRING = 'text',
  TRANSFORMTEXT = 'transformtext',
}
