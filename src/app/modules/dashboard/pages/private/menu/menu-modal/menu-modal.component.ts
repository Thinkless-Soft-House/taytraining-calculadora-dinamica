import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, type OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Menu, MenuStatus } from '../../../../../../api/model/menu.model';
import { MenuService } from '../../../../../../api/services/menu.service';

@Component({
  selector: 'app-menu-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './menu-modal.component.html',
  styleUrl: './menu-modal.component.scss',
})
export class MenuModalComponent implements OnInit {
  isLoading: boolean = false;
  isSaving: boolean = false;

  menu: any | null = null;
  viewStarted: boolean = false;

  menuStatus = MenuStatus;
  menuStatusList = Object.values(MenuStatus);

  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    caloriasMinimas: new FormControl('', [Validators.required, Validators.min(1)]),
    caloriasMaximas: new FormControl('', [Validators.required, Validators.min(1)]),
    pdfUrl: new FormControl('', [Validators.required]),
    ativo: new FormControl(true, [Validators.required]),
  });

  constructor(
    public dialogRef: MatDialogRef<MenuModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; menu?: any },
    private cdr: ChangeDetectorRef,
    private menuService: MenuService
  ) { }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    try {
      await this.initializeMenuData();
    } catch (error) {
      console.error('Error initializing menu data:', error);
    }
  }

  private async initializeMenuData(): Promise<void> {
    const menuId = this.data.id;
    console.log('Menu ID:', menuId);

    if (menuId !== -1 && this.data.menu) {
      this.menu = this.data.menu;
      this.form.patchValue({
        name: this.menu?.name || '',
        caloriasMinimas: this.extractCaloriesMin(this.menu?.description) || '',
        caloriasMaximas: this.extractCaloriesMax(this.menu?.description) || '',
        pdfUrl: this.menu?.pdfUrl || '',
        ativo: this.menu?.status === MenuStatus.ACTIVE,
      });
      this.isLoading = false;
    } else {
      console.log('Creating new menu');
      this.createFormData();
      this.isLoading = false;
    }
  }

  private extractCaloriesMin(description: string): number {
    const match = description?.match(/(\d+)-\d+/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractCaloriesMax(description: string): number {
    const match = description?.match(/\d+-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private createFormData() {
    this.form.setValue({
      name: '',
      caloriasMinimas: '',
      caloriasMaximas: '',
      pdfUrl: '',
      ativo: true,
    });
  }

  async saveMenu() {
    if (this.form.invalid || this.isSaving) {
      return;
    }

    // Custom validation for calories
    const caloriasMin = this.form.get('caloriasMinimas')?.value;
    const caloriasMax = this.form.get('caloriasMaximas')?.value;

    if (caloriasMax <= caloriasMin) {
      console.error('Calorias máximas devem ser maiores que as mínimas');
      return;
    }

    this.isSaving = true;
    const formValue = this.form.value;

    // Prepare data for backend
    const menuData: Partial<Menu> = {
      name: formValue.name,
      description: `Cardápio com faixa calórica de ${caloriasMin}-${caloriasMax} calorias`,
      pdfUrl: formValue.pdfUrl,
      status: formValue.ativo ? MenuStatus.ACTIVE : MenuStatus.INACTIVE,
    };

    try {
      if (this.data.id === -1) {
        // Create new menu using BaseModelService method
        const createdMenu = await this.menuService.create(menuData);
        console.log('Menu criado com sucesso:', createdMenu);
        this.dialogRef.close({ success: true, menu: createdMenu });
      } else {
        // Update existing menu using BaseModelService method
        const updatedMenu = await this.menuService.update(this.data.id, menuData);
        console.log('Menu atualizado com sucesso:', updatedMenu);
        this.dialogRef.close({ success: true, menu: updatedMenu });
      }
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error);
      // You might want to show a snackbar or toast here
    } finally {
      this.isSaving = false;
    }
  }
}
