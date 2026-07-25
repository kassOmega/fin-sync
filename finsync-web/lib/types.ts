export enum SystemRole {
  Owner = "Owner",
  Cashier = "Cashier",
  Sales = "Sales",
  Storekeeper = "Storekeeper",
  OperatorDriver = "OperatorDriver",
  ProjectManager = "ProjectManager",
  Foreman = "Foreman",
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: SystemRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
