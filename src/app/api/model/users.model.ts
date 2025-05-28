import { BaseModel } from "./_base.model";

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export const UserStatusLabels = {
    [UserStatus.ACTIVE]: 'Ativo',
    [UserStatus.INACTIVE]: 'Inativo',
};

export const UserStatusStyles = {
    [UserStatus.ACTIVE]: 'status status-active',
    [UserStatus.INACTIVE]: 'status status-inactive',
  };


export enum UserRole {
    ADMIN = 'ADMIN',
    COMPANY = 'COMPANY',
    UNIT = 'UNIT',
    EMPLOYEE = 'EMPLOYEE',
}

export const UserRoleLabels = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.COMPANY]: 'Gerente de Empresa',
    [UserRole.UNIT]: 'Gerente de Unidade',
    [UserRole.EMPLOYEE]: 'Funcionário',
};

export const UserRoleStyles = {
    [UserRole.ADMIN]: 'role role-style',
    [UserRole.COMPANY]: 'role role-style',
    [UserRole.UNIT]: 'role role-style',
    [UserRole.EMPLOYEE]: 'role role-style',
};

export interface User extends BaseModel {
    name: string;
    email: string;
    password: string;
    status: UserStatus;
    role: UserRole;
    companyId?: number;
    unitId?: number;
}