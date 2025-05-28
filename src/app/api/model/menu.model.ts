import { BaseModel } from "./_base.model";

export enum MenuStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface MenuFormData extends BaseModel{
  name: string;
  caloriasMinimas: number;
  caloriasMaximas: number;
  pdfUrl: string;
  status: MenuStatus;
}
