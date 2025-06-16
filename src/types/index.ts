
export interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeData {
  id: string;
  profile_id: string;
  employee_code?: string;
  phone?: string;
  address?: string;
  salary?: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SalarySlip {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  upload_date: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  employee: Employee;
}
