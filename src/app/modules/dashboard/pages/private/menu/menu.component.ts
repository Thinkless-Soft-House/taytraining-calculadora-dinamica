import { Component, type OnInit } from '@angular/core';
import { DatatableComponent, DataTableSettings, TypeColumn } from '../../../../../shared/datatable/datatable.component';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MenuModalComponent } from './menu-modal/menu-modal.component';
import { MenuFormData, MenuStatus } from '../../../../../api/model/menu.model';

interface MenuData {
  id: number;
  nomeCardapio: string;
  descricao: string;
  faixaCalorica: string;
  status: string;
  pdf: string;
}

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

  mockData: MenuData[] = [
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
      status: 'INACTIVE',
      pdf: 'cardapio_lowcarb.pdf'
    },
    {
      id: 6,
      nomeCardapio: 'Cardápio Low Carb',
      descricao: 'Cardápio com baixo teor de carboidratos, focado em proteínas e gorduras saudáveis',
      faixaCalorica: '1300-1600 kcal',
      status: 'INACTIVE',
      pdf: 'cardapio_lowcarb.pdf'
    },
    {
      id: 7,
      nomeCardapio: 'Cardápio Low Carb',
      descricao: 'Cardápio com baixo teor de carboidratos, focado em proteínas e gorduras saudáveis',
      faixaCalorica: '1300-1600 kcal',
      status: 'INACTIVE',
      pdf: 'cardapio_lowcarb.pdf'
    }
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.initializeDatatable();
  }

  private initializeDatatable(): void {
    this.datatableSettings = {
      source: 'menu',
      mockData: this.mockData,
      titleConfiguration: {
        title: 'Gestão de Cardápios',
        singularLabel: 'cardápio',
        pluralLabel: 'cardápios'
      },
      columns: [
        {
          name: 'nomeCardapio',
          label: 'Nome do Cardápio',
          type: TypeColumn.STRING,
          sortable: true,
          display: true
        },
        {
          name: 'descricao',
          label: 'Descrição',
          type: TypeColumn.LONGSTRING,
          sortable: true,
          display: true
        },
        {
          name: 'faixaCalorica',
          label: 'Faixa Calórica',
          type: TypeColumn.STRING,
          sortable: true,
          display: true
        },
        {
          name: 'status',
          label: 'Status',
          type: TypeColumn.ENUM,
          sortable: true,
          display: true,
          extra: {
            labels: {
              'ACTIVE': 'Ativo',
              'INACTIVE': 'Inativo',
              'PENDING': 'Pendente'
            },
            styles: {
              'ACTIVE': 'status-active',
              'INACTIVE': 'status-inactive',
              'PENDING': 'status-pending'
            }
          }
        },
        {
          name: 'pdf',
          label: 'PDF',
          type: TypeColumn.ACTIONS,
          sortable: false,
          display: true,
          events: [
            {
              name: 'download',
              icon: 'pdf',
              handler: (action: string, row: MenuData) => {
                console.log('Baixando PDF:', row.pdf);
                // Implementar lógica de download aqui
              },
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
            { name: 'EDIT', icon: 'edit', handler: (ctx: string, item: any) => this.edit(item.id), tooltip: 'Editar' },
            { name: 'DELETE', icon: 'delete', handler: (ctx: string, item: any) => this.delete(item.id), tooltip: 'Deletar' },
          ]
        }
      ],
      paginationConfiguration: {
        pageSize: 10,
        pageSizeOptions: [5, 10, 25, 50]
      },
      sortConfiguration: {
        active: 'nomeCardapio',
        direction: 'asc'
      },
      filterConfiguration: {
        target: ['nomeCardapio', 'descricao', 'faixaCalorica']
      },
      mobileConfiguration: {
        columnNames: ['nomeCardapio', 'descricao', 'status', 'actions']
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

  add() {
    this.openDetailsModal('create');
  }

  edit(id: number) {
    this.openDetailsModal('edit', +id);
  }

  async delete(id: number) {
    console.log('Deletando cardápio com ID:', id);
    //TODO: Implementar abertura de modal de confirmação
  }

  private openDetailsModal(action: 'create' | 'edit', id?: number) {
    console.log(`Abrindo modal de ${action} para o cardápio com ID:`, id);
    const menuData = id ? this.mockData.find(item => item.id === id) : null;

    const ref = this.dialog.open(MenuModalComponent, {
      data: {
        id: id ?? -1,
        menu: menuData
      },
    });

    ref.afterClosed().subscribe((res: any) => {
      if (res) {
        if (action === 'create') {
          this.createMenu(res);
        } else if (id) {
          this.updateMenu(id, res);
        }

        this.updateTableCount++;
        this.updateTable.next(this.updateTableCount);

        const description =
          action === 'create'
            ? 'Cardápio criado com sucesso!'
            : 'Cardápio editado com sucesso!';

        console.log(description);
      }
    });
  }

  private createMenu(formData: any): void {
    const newMenu: MenuData = {
      id: Math.max(...this.mockData.map(item => item.id)) + 1,
      nomeCardapio: formData.name,
      descricao: '', // You might want to add description field to the modal
      faixaCalorica: `${formData.caloriasMinimas}-${formData.caloriasMaximas} kcal`,
      status: formData.status,
      pdf: formData.pdfUrl
    };

    this.mockData.push(newMenu);
    this.forceUpdate$.next(this.forceUpdate$.value + 1);
    console.log('Novo cardápio criado:', newMenu);
  }

  private updateMenu(id: number, formData: any): void {
    const index = this.mockData.findIndex(item => item.id === id);
    if (index !== -1) {
      this.mockData[index] = {
        ...this.mockData[index],
        nomeCardapio: formData.name,
        faixaCalorica: `${formData.caloriasMinimas}-${formData.caloriasMaximas} kcal`,
        status: formData.status,
        pdf: formData.pdfUrl
      };

      this.forceUpdate$.next(this.forceUpdate$.value + 1);
      console.log('Cardápio atualizado:', this.mockData[index]);
    }
  }
}
