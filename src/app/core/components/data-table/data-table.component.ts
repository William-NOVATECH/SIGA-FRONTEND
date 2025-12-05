import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  template?: 'default' | 'badge' | 'status' | 'actions' | 'custom';
  badgeClass?: (value: any, row?: any) => string;
  format?: (value: any, row?: any) => string;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  handler: (row: any) => void;
  show?: (row: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: false,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading: boolean = false;
  @Input() itemsPerPage: number = 10;
  @Input() emptyMessage: string = 'No se encontraron registros';
  @Input() emptyIcon: string = 'fa-file';
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Buscar...';
  @Input() showPagination: boolean = true;
  @Input() title: string = '';

  @Output() rowClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();

  // Paginación local
  filteredData: any[] = [];
  paginatedData: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  searchTerm: string = '';

  // Ordenamiento
  sortField: string = '';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  ngOnInit() {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['itemsPerPage']) {
      this.applyFilters();
    }
  }

  applyFilters() {
    // Aplicar búsqueda
    let filtered = [...this.data];
    
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return this.columns.some(col => {
          const value = this.getFieldValue(item, col.field);
          return value && value.toString().toLowerCase().includes(search);
        });
      });
    }

    // Aplicar ordenamiento
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aValue = this.getFieldValue(a, this.sortField);
        const bValue = this.getFieldValue(b, this.sortField);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
        
        return this.sortDirection === 'ASC' ? comparison : -comparison;
      });
    }

    this.filteredData = filtered;
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortDirection = 'ASC';
    }
    this.applyFilters();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
      this.pageChange.emit(page);
    }
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  onActionClick(action: TableAction, row: any, event: Event) {
    event.stopPropagation();
    if (action.handler) {
      action.handler(row);
    }
  }

  getFieldValue(item: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], item);
  }

  getFormattedValue(item: any, column: TableColumn): string {
    const value = this.getFieldValue(item, column.field);
    if (column.format) {
      return column.format(value, item);
    }
    return value?.toString() || '';
  }

  getBadgeClass(item: any, column: TableColumn): string {
    if (column.badgeClass) {
      return column.badgeClass(this.getFieldValue(item, column.field), item);
    }
    return '';
  }

  shouldShowAction(action: TableAction, row: any): boolean {
    if (action.show) {
      return action.show(row);
    }
    return true;
  }

  get pages(): number[] {
    const maxPages = 5;
    const pages: number[] = [];
    
    if (this.totalPages <= maxPages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  get totalItems(): number {
    return this.filteredData.length;
  }

  get startItem(): number {
    return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
  }
}

