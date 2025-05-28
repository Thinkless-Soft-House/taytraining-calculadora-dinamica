import { Component, type OnInit } from '@angular/core';
import { DatatableComponent, DataTableSettings, TypeColumn } from '../../../../../shared/datatable/datatable.component';
import { BehaviorSubject } from 'rxjs';

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
            {
              name: 'edit',
              icon: 'edit',
              handler: this.handleEdit.bind(this),
              tooltip: 'Editar cardápio'
            },
            {
              name: 'delete',
              icon: 'delete',
              handler: this.handleDelete.bind(this),
              tooltip: 'Deletar cardápio'
            }
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
          handler: this.handleCreate.bind(this),
          tooltip: 'Criar novo cardápio'
        }
      ],
      filters: []
    };
  }

  handleEdit(action: string, row: MenuData): void {
    console.log('Editando cardápio:', row);
    // Implementar lógica de edição aqui
  }

  handleDelete(action: string, row: MenuData): void {
    console.log('Deletando cardápio:', row);
    // Implementar lógica de exclusão aqui
    if (confirm(`Tem certeza que deseja deletar o cardápio "${row.nomeCardapio}"?`)) {
      // Remover item dos dados mockados
      const index = this.mockData.findIndex(item => item.id === row.id);
      if (index > -1) {
        this.mockData.splice(index, 1);
        // Update the settings with new data
        this.datatableSettings = {
          ...this.datatableSettings,
          mockData: this.mockData
        };
        this.forceUpdate$.next(Date.now());
      }
    }
  }

  handleCreate(action: string): void {
    console.log('Criando novo cardápio');
    // Implementar lógica de criação aqui
  }
}
