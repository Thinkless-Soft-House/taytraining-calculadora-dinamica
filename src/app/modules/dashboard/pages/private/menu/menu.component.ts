import { Component, type OnInit, ViewChild } from '@angular/core';
import { DatatableComponent, DataTableSettings, TypeColumn } from '../../../../../shared/datatable/datatable.component';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MenuModalComponent } from './menu-modal/menu-modal.component';
import { MenuService } from '../../../../../api/services/menu.service';
import { Menu } from '../../../../../api/model/menu.model';

@Component({
  selector: 'app-menu',
  imports: [DatatableComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
  datatableSettings!: DataTableSettings;
  forceUpdate$ = new BehaviorSubject<number>(0);
  updateTable = new BehaviorSubject<number>(0)
  updateTableCount = 0;

  @ViewChild(DatatableComponent) datatableComponent?: DatatableComponent<Menu>;

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.initializeDatatable();
  }

  private initializeDatatable(): void {
    this.datatableSettings = {
      source: '/menu-calculator', // Padrão sem filtro
      titleConfiguration: {
        title: 'Gestão de Cardápios',
        singularLabel: 'cardápio',
        pluralLabel: 'cardápios'
      },
      columns: [
        {
          name: 'name',
          label: 'Nome do Cardápio',
          type: TypeColumn.STRING,
          sortable: true,
          display: true
        },
        {
          name: 'description',
          label: 'Descrição',
          type: TypeColumn.LONGSTRING,
          sortable: false, // Não permite ordenação
          display: true
        },
        {
          name: 'calorieRange',
          label: 'Faixa Calórica',
          type: TypeColumn.TRANSFORMTEXT,
          sortable: true, // Permite ordenação
          display: true,
          transform: (row: Menu) => {
            const min = row.minCalories || 0;
            const max = row.maxCalories || 0;
            return `${min} kcal - ${max} kcal`;
          }
        },
        {
          name: 'status',
          label: 'Status',
          type: TypeColumn.ENUM,
          sortable: false, // Não permite ordenação
          display: true,
          extra: {
            labels: {
              'active': 'Ativo',
              'inactive': 'Inativo'
            },
            styles: {
              'active': 'status-active',
              'inactive': 'status-inactive'
            }
          }
        },
        {
          name: 'pdfUrl',
          label: 'PDF',
          type: TypeColumn.ACTIONS,
          sortable: false,
          display: true,
          events: [
            {
              name: 'download',
              icon: 'pdf',
              handler: (action: string, row: Menu) => this.downloadPdf(row.id),
              tooltip: 'Baixar PDF do cardápio'
            }
          ]
        },
        {
          name: 'actions',
          label: 'Ações',
          type: TypeColumn.ACTIONS,
          sortable: false,
          display: true,
          events: [
            { name: 'EDIT', icon: 'edit', handler: (ctx: string, item: Menu) => this.edit(item.id), tooltip: 'Editar' },
            // { name: 'DELETE', icon: 'delete', handler: (ctx: string, item: Menu) => this.delete(item.id), tooltip: 'Deletar' },
          ]
        }
      ],
      paginationConfiguration: {
        pageSize: 10,
        pageSizeOptions: [5, 10, 25, 50]
      },
      sortConfiguration: {
        active: 'name',
        direction: 'asc'
      },
      filterConfiguration: {
        target: ['name', 'minCalories'] // Apenas name e minCalories (faixa calórica)
      },
      mobileConfiguration: {
        columnNames: ['name', 'description', 'status', 'actions']
      },
      forceUpdate$: this.forceUpdate$,
      events: [
        {
          name: 'create',
          label: 'Novo Cardápio',
          icon: 'add',
          handler: (ctx: string) => {
            this.add();
          },
          tooltip: 'Criar novo cardápio'
        }
      ],
      filters: []
    };
  }

  // Adicione este método para alterar a source dinamicamente
  setDatatableSource(hasFilter: boolean) {
    this.datatableSettings.source = hasFilter ? '/menu-calculator/filter' : '/menu-calculator';
    // Força atualização do datatable
    this.forceUpdate$.next(this.forceUpdate$.value + 1);
  }

  // Altere o método de filtro para usar a source correta
  handleFilter(event: any) {
    const value = event.target.value;
    const hasFilter = !!value && value.trim().length > 0;
    this.setDatatableSource(hasFilter);
    // Atualiza o filtro no DatatableComponent
    if (this.datatableComponent) {
      this.datatableComponent.textFilter.next(value);
    }
  }

  add() {
    this.openDetailsModal('create');
  }

  edit(id: number) {
    this.openDetailsModal('edit', id);
  }

  async delete(id: number) {
    try {
      await this.menuService.delete(id);
      // console.log('Cardápio deletado com sucesso');
      this.refreshTable();
    } catch (error) {
      console.error('Erro ao deletar cardápio:', error);
    }
  }

  private async openDetailsModal(action: 'create' | 'edit', id?: number) {
    // console.log(`Abrindo modal de ${action} para o cardápio com ID:`, id);

    const ref = this.dialog.open(MenuModalComponent, {
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      hasBackdrop: true,
      disableClose: false,
      data: {
        id: id ?? -1
      },
    });

    ref.afterClosed().subscribe((res: any) => {
      if (res?.success) {
        this.refreshTable();

        const description = action === 'create'
          ? 'Cardápio criado com sucesso!'
          : 'Cardápio editado com sucesso!';

        // console.log(description);
      }
    });
  }

  private refreshTable(): void {
    this.updateTableCount++;
    this.updateTable.next(this.updateTableCount);
    this.forceUpdate$.next(this.forceUpdate$.value + 1);
  }

  async downloadPdf(id: number) {
    try {
      const blob = await this.menuService.getFile(id).toPromise();
      if (!blob) throw new Error('Arquivo não encontrado');
      const fileName = `cardapio_${id}.pdf`;
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    }
  }
}
