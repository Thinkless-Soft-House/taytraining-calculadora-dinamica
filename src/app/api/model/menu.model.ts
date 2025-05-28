import { BaseModel } from "./_base.model";

export enum MenuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Menu extends BaseModel {
  name: string;
  description: string;
  pdfUrl: string;
  status: MenuStatus;
}
