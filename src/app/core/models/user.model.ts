import { Role } from '../enums/role.enum';  // we’ll create this enum to match your backend

export interface User {
  id: number;
  username: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  personalEmail?: string;
  personnelPhoneNumber?: string;
  domicilePhoneNumber?: string;
  maritalStatus?: string;
  role: Role;
  active: boolean;
  userType: string;      // "Student", "Teacher", "PartnerSchool", ...
  createdAt: string;     // ISO date string (Instant in Java)
  updatedAt: string;
}
