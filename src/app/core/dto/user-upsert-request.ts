export interface UserUpsertRequest {
  // required
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  domicilePhoneNumber: string;
  active: boolean;

  // optional (nullable)
  middleName: string | null;
  personalEmail: string | null;
  personnelPhoneNumber: string | null;
  maritalStatus: string | null;
}
