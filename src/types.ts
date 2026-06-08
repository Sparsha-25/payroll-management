/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
}

export interface Department {
  id: string;
  name: string;
  manager?: string;
  employeeCount?: number;
}

export interface Employee {
  id: string;
  userId: string; // link to auth user if any
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  email: string;
  phone: string;
  address: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  salary: number; // Basic Salary
  profilePhoto: string;
  performanceScore: number; // 0 - 100
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave' | 'Work From Home';
  overtimeHours: number; // Hours of overtime
  checkIn?: string;
  checkOut?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

export interface SalaryBreakdown {
  basic: number;
  hra: number; // House Rent Allowance (e.g. 40% of basic)
  da: number; // Dearness Allowance (e.g. 10% of basic)
  bonus: number;
  overtimePay: number;
  gross: number;
  tax: number; // Auto computed slab
  pf: number; // Provident Fund (e.g. 12% of basic)
  insurance: number; // Flat premium
  deductions: number; // tax + pf + insurance
  net: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  basicSalary: number;
  hra: number;
  da: number;
  bonus: number;
  overtimeHours: number;
  grossSalary: number;
  tax: number;
  pf: number;
  insurance: number;
  netSalary: number;
  status: 'Draft' | 'Processed';
  processedOn?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export interface AIPrediction {
  predictionId: string;
  type: 'salary_forecast' | 'attendance_alert' | 'performance_insight';
  title: string;
  content: string;
  timestamp: string;
}
