
export interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  joinDate?: string;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  fileName: string;
  uploadDate: string;
  fileUrl: string;
}

export interface AuthResponse {
  token: string;
  employee: Employee;
}
