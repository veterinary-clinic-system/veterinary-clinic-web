import { Role } from './enums';

export const CLINIC_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.RECEPTIONIST];

export const COUNTER_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.STAFF];

export const WAREHOUSE_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.PHARMACIST];

export const MANAGEMENT_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

export const SYSTEM_ROLES: Role[] = [Role.ADMIN];

export const CUSTOMER_ROLES: Role[] = [...CLINIC_ROLES, Role.STAFF];
