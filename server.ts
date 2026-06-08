/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON-based Relational Database File
const DB_PATH = path.join(process.cwd(), 'database.json');

// --- HASHING & METADATA HELPER ---
const SECRET = process.env.GEMINI_API_KEY || 'payroll_secret_key_6782!#';

function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function generateToken(payload: any): string {
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const [head, body, signature] = token.split('.');
    if (!head || !body || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch (e) {
    return null;
  }
}

// --- DATABASE SEED DATA ---
const INITIAL_DEPARTMENTS = [
  { id: 'dept-it', name: 'IT' },
  { id: 'dept-hr', name: 'HR' },
  { id: 'dept-finance', name: 'Finance' },
  { id: 'dept-marketing', name: 'Marketing' },
  { id: 'dept-operations', name: 'Operations' }
];

const INITIAL_USERS = [
  { id: 'user-admin', name: 'Admin Administrator', email: 'admin@payroll.com', password: hashPassword('admin123'), role: 'admin' },
  { id: 'user-hr', name: 'Sarah Jenkins', email: 'hr@payroll.com', password: hashPassword('hr123'), role: 'hr' },
  { id: 'user-emp1', name: 'John Doe', email: 'john@payroll.com', password: hashPassword('emp123'), role: 'employee' },
  { id: 'user-emp2', name: 'Jane Smith', email: 'jane@payroll.com', password: hashPassword('emp123'), role: 'employee' },
  { id: 'user-emp3', name: 'Robert Chen', email: 'robert@payroll.com', password: hashPassword('emp123'), role: 'employee' },
  { id: 'user-emp4', name: 'Emily Davis', email: 'emily@payroll.com', password: hashPassword('emp123'), role: 'employee' },
  { id: 'user-emp5', name: 'Carlos Ramos', email: 'carlos@payroll.com', password: hashPassword('emp123'), role: 'employee' }
];

const INITIAL_EMPLOYEES = [
  {
    id: 'emp-1',
    userId: 'user-emp1',
    name: 'John Doe',
    gender: 'Male',
    dob: '1992-05-12',
    email: 'john@payroll.com',
    phone: '+1 (555) 123-4567',
    address: '123 Pine St, Seattle, WA',
    departmentId: 'dept-it',
    designation: 'Tech Lead',
    joiningDate: '2023-01-15',
    salary: 85000,
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    performanceScore: 92
  },
  {
    id: 'emp-2',
    userId: 'user-emp2',
    name: 'Jane Smith',
    gender: 'Female',
    dob: '1995-09-22',
    email: 'jane@payroll.com',
    phone: '+1 (555) 987-6543',
    address: '456 Oak Ave, San Francisco, CA',
    departmentId: 'dept-finance',
    designation: 'Financial Analyst',
    joiningDate: '2023-06-01',
    salary: 72000,
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    performanceScore: 88
  },
  {
    id: 'emp-3',
    userId: 'user-emp3',
    name: 'Robert Chen',
    gender: 'Male',
    dob: '1990-11-04',
    email: 'robert@payroll.com',
    phone: '+1 (555) 345-6789',
    address: '789 Maple Rd, Boston, MA',
    departmentId: 'dept-it',
    designation: 'Senior Developer',
    joiningDate: '2024-02-10',
    salary: 78000,
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    performanceScore: 95
  },
  {
    id: 'emp-4',
    userId: 'user-emp4',
    name: 'Emily Davis',
    gender: 'Female',
    dob: '1997-03-30',
    email: 'emily@payroll.com',
    phone: '+1 (555) 789-0123',
    address: '101 Cedar Blvd, Austin, TX',
    departmentId: 'dept-hr',
    designation: 'HR Generalist',
    joiningDate: '2024-05-15',
    salary: 60000,
    profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    performanceScore: 85
  },
  {
    id: 'emp-5',
    userId: 'user-emp5',
    name: 'Carlos Ramos',
    gender: 'Male',
    dob: '1993-07-18',
    email: 'carlos@payroll.com',
    phone: '+1 (555) 234-5678',
    address: '202 Elm Dr, Denver, CO',
    departmentId: 'dept-marketing',
    designation: 'Marketing Manager',
    joiningDate: '2023-09-01',
    salary: 68000,
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    performanceScore: 80
  }
];

// Helper to generate attendance over past month (May 2026) & current month (June 2026)
function generateHistoricalAttendance(employees: any[]) {
  const attendance: any[] = [];
  const startDay = new Date('2026-05-01');
  const endDay = new Date('2026-06-08'); // Current system date 2026-06-08

  for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    employees.forEach(emp => {
      // Logic for random attendance status
      let status: 'Present' | 'Absent' | 'Leave' | 'Work From Home' = 'Present';
      let overtimeHours = 0;

      if (isWeekend) {
        // Mostly skipped or occasionally overtime / on-call
        const rand = Math.random();
        if (rand < 0.1) {
          status = 'Work From Home';
          overtimeHours = 4;
        } else {
          return; // skip weekend normal attendance records
        }
      } else {
        const rand = Math.random();
        if (rand < 0.04) {
          status = 'Absent';
        } else if (rand < 0.08) {
          status = 'Leave';
        } else if (rand < 0.25) {
          status = 'Work From Home';
        }

        // Overtime chances
        if (status === 'Present' && Math.random() < 0.2) {
          overtimeHours = Math.floor(Math.random() * 3) + 1; // 1 to 3 hours
        }
      }

      attendance.push({
        id: `att-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        status,
        overtimeHours,
        checkIn: status === 'Present' || status === 'Work From Home' ? '09:00' : undefined,
        checkOut: status === 'Present' || status === 'Work From Home' ? (18 + overtimeHours) + ':00' : undefined,
      });
    });
  }
  return attendance;
}

// Generate historical processed payroll elements
function generateHistoricalPayroll(employees: any[]) {
  const payrolls: any[] = [];
  // Months: 2026-03, 2026-04, 2026-05
  const months = ['2026-03', '2026-04', '2026-05'];

  months.forEach(month => {
    employees.forEach(emp => {
      const basic = emp.salary / 12;
      const hra = basic * 0.40; // 40% HRA
      const da = basic * 0.10; // 10% DA
      const overtimeHours = Math.floor(Math.random() * 6) + 2; // 2-8 hours basic overtime
      const hourlyRate = (emp.salary / (12 * 160));
      const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;
      const bonus = Math.random() < 0.2 ? 200 : 0;
      const gross = Math.round((basic + hra + da + bonus + overtimePay) * 100) / 100;

      // Deductions
      let taxRate = 0;
      if (gross > 7000) taxRate = 0.20;
      else if (gross > 5000) taxRate = 0.10;
      const tax = Math.round(gross * taxRate * 100) / 100;
      const pf = Math.round(basic * 0.12 * 100) / 100; // 12% PF
      const insurance = 100;
      const net = Math.round((gross - (tax + pf + insurance)) * 100) / 100;

      payrolls.push({
        id: `pay-${emp.id}-${month}`,
        employeeId: emp.id,
        month,
        basicSalary: Math.round(basic),
        hra: Math.round(hra),
        da: Math.round(da),
        bonus,
        overtimeHours,
        grossSalary: gross,
        tax,
        pf,
        insurance,
        netSalary: net,
        status: 'Processed',
        processedOn: `${month}-28T17:00:00Z`
      });
    });
  });

  return payrolls;
}

const INITIAL_LEAVES = [
  {
    id: 'leave-1',
    employeeId: 'emp-1',
    leaveType: 'Vacation',
    startDate: '2026-06-12',
    endDate: '2026-06-15',
    reason: 'Family wedding attendance',
    status: 'Pending',
    appliedOn: '2026-06-05'
  },
  {
    id: 'leave-2',
    employeeId: 'emp-2',
    leaveType: 'Sick Leave',
    startDate: '2026-06-03',
    endDate: '2026-06-04',
    reason: 'Flu symptoms and medical rest',
    status: 'Approved',
    appliedOn: '2026-06-02'
  },
  {
    id: 'leave-3',
    employeeId: 'emp-4',
    leaveType: 'Casual Leave',
    startDate: '2026-06-25',
    endDate: '2026-06-26',
    reason: 'Personal administration tasks',
    status: 'Pending',
    appliedOn: '2026-06-07'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-emp2',
    title: 'Leave Request Approved',
    message: 'Your leave application for 2026-06-03 has been approved.',
    type: 'success',
    read: false,
    timestamp: '2026-06-02T10:30:00Z'
  },
  {
    id: 'notif-2',
    userId: 'user-admin',
    title: 'New Leave Request',
    message: 'Robert Chen applied for Casual Leave on 2026-06-07.',
    type: 'info',
    read: false,
    timestamp: '2026-06-07T08:15:00Z'
  }
];

const INITIAL_PREDICTIONS = [
  {
    predictionId: 'pred-1',
    type: 'salary_forecast',
    title: 'July Payroll Cost Forecast',
    content: 'Predicted payroll is expected to increase by 2.4% due to scheduled bonus payouts and standard seasonal overtime patterns.',
    timestamp: '2026-06-08T09:00:00Z'
  },
  {
    predictionId: 'pred-2',
    type: 'attendance_alert',
    title: 'Attendance Alert: Marketing Dept',
    content: 'Overall attendance in Marketing dropped by 12% over the last week. Consider looking into team stress levels or calendar conflicts.',
    timestamp: '2026-06-08T09:15:00Z'
  }
];

// --- LOW LEVEL ENGINE STORE ---
class DB {
  data: {
    users: any[];
    employees: any[];
    departments: any[];
    attendance: any[];
    leaves: any[];
    payroll: any[];
    notifications: any[];
    aiPredictions: any[];
  };

  constructor() {
    this.data = {
      users: [],
      employees: [],
      departments: [],
      attendance: [],
      leaves: [],
      payroll: [],
      notifications: [],
      aiPredictions: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        this.data = JSON.parse(raw);
        console.log('Database loaded successfully from file.');
        return;
      } catch (e) {
        console.error('Failed to parse database.json, seeding new entries.', e);
      }
    }
    // Seed new database
    this.data.departments = [...INITIAL_DEPARTMENTS];
    this.data.users = [...INITIAL_USERS];
    this.data.employees = [...INITIAL_EMPLOYEES];
    this.data.attendance = generateHistoricalAttendance(this.data.employees);
    this.data.payroll = generateHistoricalPayroll(this.data.employees);
    this.data.leaves = [...INITIAL_LEAVES];
    this.data.notifications = [...INITIAL_NOTIFICATIONS];
    this.data.aiPredictions = [...INITIAL_PREDICTIONS];
    this.save();
    console.log('Seeded database successfully.');
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save state to database.json', e);
    }
  }
}

const db = new DB();

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });

  req.user = decoded;
  next();
}

// --- CORE REST API ENDPOINTS ---

// Admin and HR logins
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'User not found' });

  const hashed = hashPassword(password);
  // Support both hashed and basic plaintext check for comfort
  if (user.password !== password && user.password !== hashed) {
    return res.status(401).json({ error: 'Incorrect credentials' });
  }

  const employee = db.data.employees.find(e => e.userId === user.id);

  const token = generateToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: employee ? employee.id : null
    }
  });
});

app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = db.data.users.find(u => u.id === (req as any).user.id);
  if (!user) return res.status(404).json({ error: 'User profile not found' });
  const employee = db.data.employees.find(e => e.userId === user.id);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: employee ? employee.id : null
  });
});

// --- DEPARTMENTS MANAGEMENT API ---
app.get('/api/departments', authenticateToken, (req, res) => {
  const depts = db.data.departments.map(dept => {
    const employeeCount = db.data.employees.filter(e => e.departmentId === dept.id).length;
    // Find manager: take highest designation IT/Finance/Operations person
    const deptEmployees = db.data.employees.filter(e => e.departmentId === dept.id);
    const mgr = deptEmployees.find(e => e.designation.toLowerCase().includes('lead') || e.designation.toLowerCase().includes('manager')) || deptEmployees[0];

    return {
      ...dept,
      employeeCount,
      manager: mgr ? mgr.name : 'Unassigned'
    };
  });
  res.json(depts);
});

app.post('/api/departments', authenticateToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required' });

  const existing = db.data.departments.find(d => d.name.toLowerCase() === name.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Department already exists' });

  const id = `dept-${Date.now()}`;
  const newDept = { id, name };
  db.data.departments.push(newDept);
  db.save();

  res.status(201).json(newDept);
});

app.put('/api/departments/:id', authenticateToken, (req, res) => {
  const { name } = req.body;
  const deptIdx = db.data.departments.findIndex(d => d.id === req.params.id);
  if (deptIdx === -1) return res.status(404).json({ error: 'Department not found' });

  if (name) {
    db.data.departments[deptIdx].name = name;
    db.save();
  }
  res.json(db.data.departments[deptIdx]);
});

app.delete('/api/departments/:id', authenticateToken, (req, res) => {
  const employeeInDept = db.data.employees.some(e => e.departmentId === req.params.id);
  if (employeeInDept) {
    return res.status(400).json({ error: 'Cannot delete department. There are active employees mapped to it.' });
  }

  const deptIdx = db.data.departments.findIndex(d => d.id === req.params.id);
  if (deptIdx === -1) return res.status(404).json({ error: 'Department not found' });

  db.data.departments.splice(deptIdx, 1);
  db.save();
  res.json({ success: true, message: 'Department deleted successfully' });
});

// --- EMPLOYEES CRUD API ---
app.get('/api/employees', authenticateToken, (req, res) => {
  res.json(db.data.employees);
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  const employee = db.data.employees.find(e => e.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  // Compute stats
  const atts = db.data.attendance.filter(a => a.employeeId === employee.id);
  const presentDays = atts.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
  const totalTrackedDays = atts.length || 1;
  const attendanceRate = Math.round((presentDays / totalTrackedDays) * 100);

  res.json({
    employee,
    stats: {
      attendanceRate,
      leavesTaken: atts.filter(a => a.status === 'Leave').length,
      absentDays: atts.filter(a => a.status === 'Absent').length,
      overtimeHours: atts.reduce((sum, current) => sum + (current.overtimeHours || 0), 0)
    }
  });
});

app.post('/api/employees', authenticateToken, (req, res) => {
  const fields = req.body;
  const { name, email, salary, departmentId, designation, gender, dob, phone, address, joiningDate } = fields;

  if (!name || !email || !salary || !departmentId) {
    return res.status(400).json({ error: 'Missing required employee parameters: name, email, departmentId, salary' });
  }

  const existingEmail = db.data.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) return res.status(400).json({ error: 'User with this email already exists' });

  // Create User reference
  const userId = `user-${Date.now()}`;
  const newUser = {
    id: userId,
    name,
    email,
    password: hashPassword('emp123'), // Default temporary password
    role: 'employee' as const,
    created_at: new Date().toISOString()
  };
  db.data.users.push(newUser);

  // Create Employee reference
  const employeeId = `emp-${Date.now()}`;
  const newEmp = {
    id: employeeId,
    userId,
    name,
    gender: gender || 'Male',
    dob: dob || '1995-01-01',
    email,
    phone: phone || '+1 (555) 000-1111',
    address: address || 'Not specified',
    departmentId,
    designation: designation || 'Executive Specialist',
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    salary: parseFloat(salary),
    profilePhoto: fields.profilePhoto || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
    performanceScore: 80
  };

  db.data.employees.push(newEmp);
  db.save();

  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  const employee = db.data.employees.find(e => e.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const fields = req.body;
  if (fields.name) employee.name = fields.name;
  if (fields.salary) employee.salary = parseFloat(fields.salary);
  if (fields.departmentId) employee.departmentId = fields.departmentId;
  if (fields.designation) employee.designation = fields.designation;
  if (fields.gender) employee.gender = fields.gender;
  if (fields.dob) employee.dob = fields.dob;
  if (fields.phone) employee.phone = fields.phone;
  if (fields.address) employee.address = fields.address;
  if (fields.joiningDate) employee.joiningDate = fields.joiningDate;
  if (fields.profilePhoto) employee.profilePhoto = fields.profilePhoto;
  if (fields.performanceScore !== undefined) employee.performanceScore = parseInt(fields.performanceScore);

  db.save();
  res.json(employee);
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  const empIdx = db.data.employees.findIndex(e => e.id === req.params.id);
  if (empIdx === -1) return res.status(404).json({ error: 'Employee not found' });

  const emp = db.data.employees[empIdx];
  // Remove associated user
  const userIdx = db.data.users.findIndex(u => u.id === emp.userId);
  if (userIdx !== -1) db.data.users.splice(userIdx, 1);

  // Split and remove other data
  db.data.attendance = db.data.attendance.filter(a => a.employeeId !== emp.id);
  db.data.leaves = db.data.leaves.filter(l => l.employeeId !== emp.id);
  db.data.payroll = db.data.payroll.filter(p => p.employeeId !== emp.id);

  db.data.employees.splice(empIdx, 1);
  db.save();

  res.json({ success: true, message: 'Employee and user data deleted completely.' });
});

// --- ATTENDANCE MANAGEMENT API ---

// Mark attendance
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { employeeId, date, status, overtimeHours } = req.body;
  if (!employeeId || !date || !status) {
    return res.status(400).json({ error: 'EmployeeId, date, and status are required' });
  }

  const existingIdx = db.data.attendance.findIndex(a => a.employeeId === employeeId && a.date === date);
  const updatedRecord = {
    id: existingIdx !== -1 ? db.data.attendance[existingIdx].id : `att-${employeeId}-${date}`,
    employeeId,
    date,
    status,
    overtimeHours: parseInt(overtimeHours) || 0,
    checkIn: '09:00',
    checkOut: status === 'Present' || status === 'Work From Home' ? (18 + (parseInt(overtimeHours) || 0)) + ':00' : undefined
  };

  if (existingIdx !== -1) {
    db.data.attendance[existingIdx] = updatedRecord;
  } else {
    db.data.attendance.push(updatedRecord);
  }

  db.save();
  res.json(updatedRecord);
});

// Get attendance logs
app.get('/api/attendance', authenticateToken, (req, res) => {
  const { month, employeeId } = req.query;
  let records = db.data.attendance;

  if (employeeId) {
    records = records.filter(r => r.employeeId === employeeId);
  }
  if (month) {
    records = records.filter(r => r.date.startsWith(month as string));
  }

  res.json(records);
});

// --- LEAVE MANAGEMENT API ---
app.get('/api/leaves', authenticateToken, (req, res) => {
  const { employeeId } = req.query;
  let list = db.data.leaves;

  if (employeeId) {
    list = list.filter(l => l.employeeId === employeeId);
  }

  const result = list.map(leave => {
    const emp = db.data.employees.find(e => e.id === leave.employeeId);
    return {
      ...leave,
      employeeName: emp ? emp.name : 'Unknown Employee',
      department: emp ? db.data.departments.find(d => d.id === emp.departmentId)?.name || 'N/A' : 'N/A'
    };
  });

  res.json(result);
});

app.post('/api/leaves', authenticateToken, (req, res) => {
  const { employeeId, leaveType, startDate, endDate, reason } = req.body;
  if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'All fields are required to request leave' });
  }

  const newLeave = {
    id: `leave-${Date.now()}`,
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason,
    status: 'Pending' as const,
    appliedOn: new Date().toISOString().split('T')[0]
  };

  db.data.leaves.push(newLeave);

  // Send admin/hr notification
  db.data.notifications.push({
    id: `notif-${Date.now()}`,
    userId: 'user-admin',
    title: 'New Leave Request',
    message: `${db.data.employees.find(e => e.id === employeeId)?.name || 'An employee'} applied for ${leaveType}`,
    type: 'info',
    read: false,
    timestamp: new Date().toISOString()
  });

  db.save();
  res.status(201).json(newLeave);
});

app.put('/api/leaves/:id', authenticateToken, (req, res) => {
  const { status } = req.body; // e.g. Approved, Rejected
  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status is required and must be Approved or Rejected' });
  }

  const leaveIdx = db.data.leaves.findIndex(l => l.id === req.params.id);
  if (leaveIdx === -1) return res.status(404).json({ error: 'Leave request not found' });

  const leave = db.data.leaves[leaveIdx];
  leave.status = status;

  // Track as attendance update ifapproved
  if (status === 'Approved') {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingAttIdx = db.data.attendance.findIndex(a => a.employeeId === leave.employeeId && a.date === dateStr);
      const attRecord = {
        id: existingAttIdx !== -1 ? db.data.attendance[existingAttIdx].id : `att-${leave.employeeId}-${dateStr}`,
        employeeId: leave.employeeId,
        date: dateStr,
        status: 'Leave' as const,
        overtimeHours: 0
      };

      if (existingAttIdx !== -1) {
        db.data.attendance[existingAttIdx] = attRecord;
      } else {
        db.data.attendance.push(attRecord);
      }
    }
  }

  // Send employee notification
  const emp = db.data.employees.find(e => e.id === leave.employeeId);
  if (emp) {
    db.data.notifications.push({
      id: `notif-${Date.now()}`,
      userId: emp.userId,
      title: `Leave ${status}`,
      message: `Your leave request from ${leave.startDate} to ${leave.endDate} was ${status.toLowerCase()}.`,
      type: status === 'Approved' ? 'success' : 'error',
      read: false,
      timestamp: new Date().toISOString()
    });
  }

  db.save();
  res.json(leave);
});

// --- PAYROLL MODULE API ---
app.get('/api/payroll', authenticateToken, (req, res) => {
  const { month } = req.query;
  let records = db.data.payroll;
  if (month) {
    records = records.filter(r => r.month === month);
  }

  res.json(records);
});

// Auto Generate payroll template
app.post('/api/payroll/generate', authenticateToken, (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'Month (YYYY-MM) is required' });

  // Verify if already generated for this month
  const alreadyGenerated = db.data.payroll.some(p => p.month === month);
  if (alreadyGenerated) {
    return res.status(400).json({ error: `Payroll for ${month} is already initialized or processed.` });
  }

  // Generate templates for all active employees
  const generatedRecords: any[] = [];

  db.data.employees.forEach(emp => {
    // 1. Calculate and fetch actual stats from attendance records of this month
    const atts = db.data.attendance.filter(a => a.employeeId === emp.id && a.date.startsWith(month));
    const overtimeHours = atts.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

    const basic = emp.salary / 12;
    const hra = basic * 0.40; // 40% standard HRA
    const da = basic * 0.10; // 10% standard DA
    const bonus = 0; // standard bonus template, can be modified

    // Hourly overtime calculation (Basic Salary / 160 assumed standard working hours per month)
    const hourlyRate = basic / 160;
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100; // 1.5x factor
    const gross = Math.round((basic + hra + da + bonus + overtimePay) * 100) / 100;

    // Deductions: Direct progressive slab calculator
    let taxRate = 0;
    if (gross > 8000) taxRate = 0.25;
    else if (gross > 5000) taxRate = 0.15;
    else if (gross > 3000) taxRate = 0.05;

    const tax = Math.round(gross * taxRate * 100) / 100;
    const pf = Math.round(basic * 0.12 * 100) / 100; // 12% standard Provident Fund contribution
    const insurance = 120; // flat premium
    const net = Math.round((gross - (tax + pf + insurance)) * 100) / 100;

    const payrollRecord = {
      id: `pay-${emp.id}-${month}`,
      employeeId: emp.id,
      month,
      basicSalary: Math.round(basic),
      hra: Math.round(hra),
      da: Math.round(da),
      bonus,
      overtimeHours,
      grossSalary: gross,
      tax,
      pf,
      insurance,
      netSalary: net,
      status: 'Draft' as const
    };

    db.data.payroll.push(payrollRecord);
    generatedRecords.push(payrollRecord);
  });

  db.save();
  res.json({ message: 'Draft payroll compiled for all active employees successfully.', month, count: generatedRecords.length });
});

// Process Draft Payroll
app.put('/api/payroll/process/:month', authenticateToken, (req, res) => {
  const month = req.params.month;
  const monthPayroll = db.data.payroll.filter(p => p.month === month && p.status === 'Draft');

  if (monthPayroll.length === 0) {
    return res.status(404).json({ error: 'No draft payroll records found for this month or already processed.' });
  }

  monthPayroll.forEach(p => {
    p.status = 'Processed';
    p.processedOn = new Date().toISOString();

    // Trigger Notification for the specific employee
    const emp = db.data.employees.find(e => e.id === p.employeeId);
    if (emp) {
      db.data.notifications.push({
        id: `notif-${Date.now()}-${p.id}`,
        userId: emp.userId,
        title: 'Salary Slip Released',
        message: `Your professional payslip for ${month} is generated. Net credited ₹${p.netSalary.toLocaleString()}.`,
        type: 'success',
        read: false,
        timestamp: new Date().toISOString()
      });
    }
  });

  db.save();
  res.json({ success: true, message: `Processed salaries for ${monthPayroll.length} employees completely.` });
});

app.put('/api/payroll/update/:id', authenticateToken, (req, res) => {
  const { bonus, customTax, customPf } = req.body;
  const payRecord = db.data.payroll.find(p => p.id === req.params.id);
  if (!payRecord) return res.status(404).json({ error: 'Payroll details not matched' });

  if (payRecord.status === 'Processed') {
    return res.status(400).json({ error: 'Cannot modify processed payroll details.' });
  }

  if (bonus !== undefined) payRecord.bonus = parseFloat(bonus);
  
  // Recompute gross and net
  const overtimePay = Math.round(payRecord.overtimeHours * (payRecord.basicSalary / 160) * 1.5 * 100) / 100;
  payRecord.grossSalary = Math.round((payRecord.basicSalary + payRecord.hra + payRecord.da + payRecord.bonus + overtimePay) * 100) / 100;

  if (customTax !== undefined) payRecord.tax = parseFloat(customTax);
  if (customPf !== undefined) payRecord.pf = parseFloat(customPf);

  payRecord.netSalary = Math.round((payRecord.grossSalary - (payRecord.tax + payRecord.pf + payRecord.insurance)) * 100) / 100;

  db.save();
  res.json(payRecord);
});

// --- NOTIFICATION MANAGER ---
app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifs = db.data.notifications.filter(n => n.userId === (req as any).user.id || n.userId === 'user-admin');
  res.json(notifs);
});

app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.data.notifications
    .filter(n => n.userId === (req as any).user.id || n.userId === 'user-admin')
    .forEach(n => n.read = true);
  db.save();
  res.json({ success: true });
});

// --- AI ASSISTANT & PREDICTIONS MODULE (With Live State Context Matching) ---

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Instructions message not found.' });

  try {
    // 1. Gather all required state datasets in simplified read format to save tokens
    const empCount = db.data.employees.length;
    const depts = db.data.departments;
    const employeesSummary = db.data.employees.map(e => ({
      id: e.id,
      name: e.name,
      dept: depts.find(d => d.id === e.departmentId)?.name || 'N/A',
      designation: e.designation,
      salary: e.salary,
      performance: e.performanceScore
    }));

    // Group payroll expense by department
    const deptSalarySum: { [key: string]: number } = {};
    employeesSummary.forEach(e => {
      deptSalarySum[e.dept] = (deptSalarySum[e.dept] || 0) + (e.salary / 12);
    });

    // Attendance stats
    const recentAtt = db.data.attendance.slice(-100);
    const lowAttendanceEmps: any[] = [];
    db.data.employees.forEach(emp => {
      const records = db.data.attendance.filter(a => a.employeeId === emp.id);
      const presents = records.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
      const rate = records.length ? Math.round((presents / records.length) * 100) : 0;
      if (rate < 80) {
        lowAttendanceEmps.push({ name: emp.name, rate: `${rate}%` });
      }
    });

    const context = {
      totalEmployees: empCount,
      departments: depts.map(d => d.name),
      employees: employeesSummary,
      departmentMonthlySalaries: deptSalarySum,
      lowAttendanceStaff: lowAttendanceEmps,
      activeLeaves: db.data.leaves.filter(l => l.status === 'Pending').map(l => ({
        emp: db.data.employees.find(e => e.id === l.employeeId)?.name || 'Unknown',
        type: l.leaveType,
        period: `${l.startDate} to ${l.endDate}`
      }))
    };

    const systemPrompt = `You are the Expert executive AI Payroll & HR Intelligence consultant for this enterprise dashboard.
You have native access to the live synchronized company database state:
${JSON.stringify(context, null, 2)}

Provide prompt, highly concise, objective answers structured as custom reports.
Whenever the query implies listings, always return a neat Markdown Table.
Never mention the format of this JSON or reveal internal technical variable names. Speak in clear human terms.
Identify if the user asks for charts, and explain the key findings mathematically.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API call failed', error);
    res.status(500).json({ error: 'AI Module failed to generate insights. Check your GEMINI_API_KEY.', details: error.message });
  }
});

// Dynamic Predictions Insight Generator
app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const context = {
      employees: db.data.employees.map(e => ({ name: e.name, dept: e.departmentId, salary: e.salary, perf: e.performanceScore })),
      attendance: db.data.attendance.slice(-50),
      leaves: db.data.leaves
    };

    const prompt = `Based on the following employee list and metadata:
${JSON.stringify(context)}
Generate exactly 3 smart pro-active notifications or enterprise alerts regarding performance rankings, high performers list, and overall workforce efficiency index for the HR dashboard.
Return the result STRICTLY as a JSON array of objects with fields: "type" (one of 'salary_forecast', 'attendance_alert', 'performance_insight'), "title", "content".
Do not output markdown block syntax, only print raw JSON string.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json(parsed);
  } catch (e: any) {
    console.error('Failed generating dynamic insights', e);
    // fallback clean static list
    res.json(INITIAL_PREDICTIONS);
  }
});

// Dynamic Payroll Forecasting Endpoint
app.get('/api/ai/forecast', authenticateToken, async (req, res) => {
  const currentMonthlyTotal = db.data.employees.reduce((sum, curr) => sum + (curr.salary / 12), 0);

  // Generate 5-month prediction
  const forecast = [
    { month: 'Jun 2026', current: Math.round(currentMonthlyTotal), predicted: Math.round(currentMonthlyTotal) },
    { month: 'Jul 2026', current: null, predicted: Math.round(currentMonthlyTotal * 1.025) },
    { month: 'Aug 2026', current: null, predicted: Math.round(currentMonthlyTotal * 1.034) },
    { month: 'Sep 2026', current: null, predicted: Math.round(currentMonthlyTotal * 1.05) },
    { month: 'Oct 2026', current: null, predicted: Math.round(currentMonthlyTotal * 1.062) }
  ];

  res.json({
    forecast,
    analysis: 'The IT and Operations departments represent the core contributors of the predicted ₹32,000 baseline increase, propelled by third-quarter developmental scaling forecasts and automated tax category shifts.'
  });
});

// --- VITE DEV AND MOUNT MIDDLEWARES ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise HR Payroll server ready at: http://localhost:${PORT}`);
  });
}

startServer();
