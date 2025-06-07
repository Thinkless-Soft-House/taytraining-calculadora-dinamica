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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './menu-modal.component.html',
  styleUrl: './menu-modal.component.scss',
})
export class MenuModalComponent implements OnInit {
  isLoading: boolean = false;
  isSaving: boolean = false;
  isLoadingData: boolean = false;

  menu: any | null = null;
  viewStarted: boolean = false;

  menuStatus = MenuStatus;
  menuStatusList = Object.values(MenuStatus);

  form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    caloriasMinimas: new FormControl('', [Validators.required]),
    caloriasMaximas: new FormControl('', [Validators.required]),
    ativo: new FormControl(true, [Validators.required]),
  });

  isCaloriesInvalid: boolean = false;
  selectedPdfFile: File | null = null;
  selectedFileName: string = 'Nenhum arquivo selecionado';

  constructor(
    public dialogRef: MatDialogRef<MenuModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private cdr: ChangeDetectorRef,
    private menuService: MenuService,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit(): Promise<void> {
    // Adiciona listener para validação customizada
    this.form.valueChanges.subscribe(() => {
      this.checkCaloriesValidity();
    });
    return (async () => {
      try {
        await this.initializeMenuData();
      } catch (error) {
        console.error('Error initializing menu data:', error);
      }
    })();
  }

  private checkCaloriesValidity() {
    const min = this.form.get('caloriasMinimas')?.value;
    const max = this.form.get('caloriasMaximas')?.value;
    this.isCaloriesInvalid =
      min !== null && max !== null && min !== '' && max !== '' && Number(min) > Number(max);
  }

  getSaveButtonTooltip(): string {
    if (this.isCaloriesInvalid) {
      return 'Calorias mínimas não pode ser maior que calorias máximas.';
    }
    if (this.form.invalid) {
      const errors: string[] = [];
      const controls = this.form.controls;
      if (controls['name'].invalid) {
        if (controls['name'].errors?.['required']) errors.push('Nome é obrigatório.');
        if (controls['name'].errors?.['maxlength']) errors.push('Nome muito longo.');
      }
      if (controls['caloriasMinimas'].invalid) {
        errors.push('Calorias mínimas é obrigatório.');
      }
      if (controls['caloriasMaximas'].invalid) {
        errors.push('Calorias máximas é obrigatório.');
      }
      return errors.join(' ');
    }
    return '';
  }

  private async initializeMenuData(): Promise<void> {
    const menuId = this.data.id;
    // console.log('Menu ID:', menuId);

    if (menuId !== -1) {
      this.isLoadingData = true;
      try {
        const response = await this.menuService.getById(menuId);
        this.menu = response.data || response;
        // console.log('Menu data loaded:', this.menu);
        this.form.patchValue({
          name: this.menu?.name || '',
          caloriasMinimas: this.menu?.minCalories || '',
          caloriasMaximas: this.menu?.maxCalories || '',
          ativo: this.menu?.status === MenuStatus.ACTIVE,
        });
        // Se já existe um PDF, mostra o nome do arquivo
        if (this.menu && this.menu.pdfUrl) {
          const path = this.menu.pdfUrl as string;
          this.selectedFileName = path.split('/').pop() || 'Nenhum arquivo selecionado';
        }
      } catch (error) {
        console.error('Erro ao carregar dados do cardápio:', error);
      } finally {
        this.isLoadingData = false;
      }
    } else {
      // console.log('Creating new menu');
      this.createFormData();
    }
  }

  private createFormData() {
    this.form.setValue({
      name: '',
      caloriasMinimas: '',
      caloriasMaximas: '',
      ativo: true,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedPdfFile = file;
        // Opcional: limpar erro do form
        this.form.get('pdfUrl')?.setErrors(null);
      } else {
        this.selectedPdfFile = null;
        this.form.get('pdfUrl')?.setErrors({ invalidType: true });
      }
    } else {
      this.selectedFileName = 'Nenhum arquivo selecionado';
    }
  }

  async saveMenu() {
    if (this.form.invalid || this.isCaloriesInvalid || this.isSaving) {
      return;
    }

    const caloriasMin = this.form.get('caloriasMinimas')?.value;
    const caloriasMax = this.form.get('caloriasMaximas')?.value;
    this.isSaving = true;
    const formValue = this.form.value;

    // Monta FormData para envio multipart
    const formData = new FormData();
    formData.append('name', formValue.name);
    formData.append('description', `Cardápio com faixa calórica de ${caloriasMin}-${caloriasMax} calorias`);
    formData.append('status', formValue.ativo ? MenuStatus.ACTIVE : MenuStatus.INACTIVE);
    formData.append('minCalories', caloriasMin);
    formData.append('maxCalories', caloriasMax);
    if (this.selectedPdfFile) {
      formData.append('file', this.selectedPdfFile);
    }

    try {
      let result;
      if (this.data.id === -1) {
        // Criação
        result = await this.menuService.createWithFile(formData);
        this.snackBar.open('Cardápio criado com sucesso!', '✓', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      } else {
        // Atualização
        result = await this.menuService.updateWithFile(this.data.id, formData);
        this.snackBar.open('Cardápio atualizado com sucesso!', '✓', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
      this.dialogRef.close({ success: true, menu: result });
    } catch (error: any) {
      this.isSaving = false;
      console.error('Erro ao salvar cardápio:', error);
      const errorMessage = error.error?.message || 'Erro ao salvar cardápio. Tente novamente.';
      this.snackBar.open(errorMessage, '✕', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }
}
