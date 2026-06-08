/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  QrCode,
  X,
  UserCheck,
  Building
} from 'lucide-react';
import { Employee, Department } from '../types';

interface EmployeeWithStats {
  employee: Employee;
  stats: {
    attendanceRate: number;
    leavesTaken: number;
    absentDays: number;
    overtimeHours: number;
  };
}

interface EmployeeManagerProps {
  token: string;
  role: 'admin' | 'hr' | 'employee';
  currentUserEmployeeId: string | null;
  departments: Department[];
}

export default function EmployeeManager({ token, role, currentUserEmployeeId, departments }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formDob, setFormDob] = useState('1995-01-01');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('2024-01-01');
  const [formSalary, setFormSalary] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formPerformance, setFormPerformance] = useState('85');

  // Payslip generation helper variables
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [activePayslip, setActivePayslip] = useState<any | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchPayslips();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
        // If employee role, auto select their own profile
        if (role === 'employee' && currentUserEmployeeId) {
          const matched = data.find((e: Employee) => e.id === currentUserEmployeeId);
          if (matched) fetchEmployeeDetails(matched.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayslips = async () => {
    try {
      const res = await fetch('/api/payroll', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayslips(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployeeDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedEmp(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreateForm = () => {
    setIsEditing(false);
    setFormError('');
    setFormId('');
    setFormName('');
    setFormGender('Male');
    setFormDob('1994-10-15');
    setFormEmail('');
    setFormPhone('+1 (555) 555-0199');
    setFormAddress('742 Evergreen Terrace, Springfield');
    setFormDeptId(departments[0]?.id || '');
    setFormDesignation('Software Architect');
    setFormJoiningDate('2026-01-01');
    setFormSalary('80000');
    setFormPhoto('');
    setFormPerformance('85');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setIsEditing(true);
    setFormError('');
    setFormId(emp.id);
    setFormName(emp.name);
    setFormGender(emp.gender);
    setFormDob(emp.dob);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormAddress(emp.address);
    setFormDeptId(emp.departmentId);
    setFormDesignation(emp.designation);
    setFormJoiningDate(emp.joiningDate);
    setFormSalary(emp.salary.toString());
    setFormPhoto(emp.profilePhoto);
    setFormPerformance(emp.performanceScore.toString());
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: formName,
      gender: formGender,
      dob: formDob,
      email: formEmail,
      phone: formPhone,
      address: formAddress,
      departmentId: formDeptId,
      designation: formDesignation,
      joiningDate: formJoiningDate,
      salary: parseFloat(formSalary),
      profilePhoto: formPhoto || undefined,
      performanceScore: parseInt(formPerformance)
    };

    const url = isEditing ? `/api/employees/${formId}` : '/api/employees';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsFormOpen(false);
        fetchEmployees();
        if (selectedEmp && selectedEmp.employee.id === formId) {
          fetchEmployeeDetails(formId);
        }
      } else {
        setFormError(data.error || 'Failed saving employee.');
      }
    } catch (err) {
      setFormError('Network connection failure.');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete employee ${name}? This resets all historical attendance records, leave logs and payroll slips.`)) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchEmployees();
        setSelectedEmp(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- HTML QR Code / Verification generator ---
  const handlePrintPayslip = (payslip: any) => {
    const matchedEmp = employees.find(e => e.id === payslip.employeeId);
    if (!matchedEmp) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
       alert('Please allow popups to output printable PDF format!');
       return;
    }

    const verificationHash = crypto.randomUUID().slice(0, 8).toUpperCase();

    printWin.document.write(`
      <html>
        <head>
          <title>Payslip_${matchedEmp.name}_${payslip.month}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 20px; font-weight: 700; color: #0d9488; }
            .title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .card h3 { margin-top: 0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
            .info-line { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
            .val { font-weight: 600; }
            .table-container { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f8fafc; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 10px; text-align: left; }
            td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .net-box { background-color: #f0fdfa; border: 1px solid #99f6e4; padding: 20px; border-radius: 8px; text-align: right; margin-bottom: 30px; }
            .net-val { font-size: 22px; font-weight: 800; color: #0f766e; }
            .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">✦ HR-Payroll Enterprise</div>
              <div style="font-size: 11px; margin-top: 5px;">Headquarters: Tech Tower, Suite 400</div>
            </div>
            <div style="text-align: right;">
              <div class="title">Official Salary Slip</div>
              <div style="font-size: 13px; font-weight: 600; margin-top: 5px;">Statement for Period: ${payslip.month}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3>Employee Personal Credentials</h3>
              <div class="info-line"><span>Name:</span><span class="val">${matchedEmp.name}</span></div>
              <div class="info-line"><span>Designation:</span><span class="val">${matchedEmp.designation}</span></div>
              <div class="info-line"><span>Email:</span><span class="val">${matchedEmp.email}</span></div>
              <div class="info-line"><span>Bank Routing ID:</span><span class="val">TRANS-**4921</span></div>
            </div>
            <div class="card">
              <h3>Salary & Work Summary</h3>
              <div class="info-line"><span>Contract Basic:</span><span class="val">₹${matchedEmp.salary.toLocaleString()} / year</span></div>
              <div class="info-line"><span>Approved Overtime Hours:</span><span class="val">${payslip.overtimeHours} hrs</span></div>
              <div class="info-line"><span>Direct Credit Protocol:</span><span class="val">ACH Electronic Transfer</span></div>
            </div>
          </div>

          <div class="table-container">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Payment Distribution Details</div>
            <table>
              <thead>
                <tr>
                  <th>Earning Components</th>
                  <th>Amount</th>
                  <th>Deduction Components</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary (Allocated)</td>
                  <td>₹${payslip.basicSalary.toLocaleString()}</td>
                  <td>Tax Deducted (Progressive Slab)</td>
                  <td>₹${payslip.tax.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>House Rent Allowance (HRA)</td>
                  <td>₹${payslip.hra.toLocaleString()}</td>
                  <td>Provident Fund Contribution (PF)</td>
                  <td>₹${payslip.pf.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Dearness Allowance (DA)</td>
                  <td>₹${payslip.da.toLocaleString()}</td>
                  <td>Corporate Health Insurance Contribution</td>
                  <td>₹${payslip.insurance.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Overtime Wages (x1.5 Standard)</td>
                  <td>₹${Math.round(payslip.overtimeHours * (payslip.basicSalary / 160) * 1.5 * 100) / 100}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Performance Bonus Pay</td>
                  <td>₹${payslip.bonus.toLocaleString()}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr style="font-weight: 700;">
                  <td>Total Gross Salary</td>
                  <td>₹${payslip.grossSalary.toLocaleString()}</td>
                  <td>Total Deductions Made</td>
                  <td>₹${(payslip.tax + payslip.pf + payslip.insurance).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="net-box">
            <span style="font-size: 13px; text-transform: uppercase; color: #475569; display: block; margin-bottom: 5px;">Net Salary Credited (In-Hand)</span>
            <span class="net-val">₹${payslip.netSalary.toLocaleString()}</span>
          </div>

          <div class="footer">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div>
                <div style="font-weight: 700; color: #475569;">System Verified Security Digest</div>
                <div style="font-family: monospace; font-size: 10px;">HASH_KEY: ${verificationHash}-VERIFIED</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div>Digital Certificate Verification Protocol</div>
              <div style="font-weight: 600;">Status: Securely Processed via Automated Ledger</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // --- SMART SEARCH SYNTAX TRANSLATION ---
  // Users enter natural queries like:
  // "Finance employees over 60000"
  // "IT over 80000"
  // "Male IT"
  const getFilteredEmployees = () => {
    let lowerStr = searchTerm.toLowerCase();
    if (!lowerStr) return employees;

    // Check smart search protocols
    let minSalary = 0;
    const salaryMatch = lowerStr.match(/(?:over|above|greater than|earning|>\s?)(\d+)/i);
    if (salaryMatch) {
      minSalary = parseInt(salaryMatch[1]);
      lowerStr = lowerStr.replace(/(?:over|above|greater than|earning|>\s?)(\d+)/gi, '').trim();
    }

    // Check gender tags
    let filterGender = '';
    if (lowerStr.includes('female')) {
      filterGender = 'female';
      lowerStr = lowerStr.replace('female', '').trim();
    } else if (lowerStr.includes('male')) {
      filterGender = 'male';
      lowerStr = lowerStr.replace('male', '').trim();
    }

    return employees.filter(emp => {
      // 1. Check salary boundary
      if (minSalary && emp.salary < minSalary) return false;

      // 2. Check gender
      if (filterGender && emp.gender.toLowerCase() !== filterGender) return false;

      // 3. Match terms in designations, names, or departments
      const matchedDept = departments.find(d => d.id === emp.departmentId)?.name || '';
      const textMatch =
        emp.name.toLowerCase().includes(lowerStr) ||
        emp.designation.toLowerCase().includes(lowerStr) ||
        emp.email.toLowerCase().includes(lowerStr) ||
        matchedDept.toLowerCase().includes(lowerStr);

      return textMatch;
    });
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* List Column */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employee Staffing Directory</h2>
          </div>
          {role !== 'employee' && (
            <button
              onClick={handleOpenCreateForm}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
        </div>

        {/* Smart Search Field */}
        <div className="relative mb-5 bg-slate-50 rounded-lg border border-slate-200 p-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Query (e.g. 'Finance over 50000', 'Senior Developer Seattle')"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-10 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 rounded focus:outline-none font-sans"
            />
          </div>
          <span className="text-[10px] text-blue-600/80 block mt-1 px-1 font-mono font-semibold">
            💡 Supported queries: gender, department, designations, and salary thresholds.
          </span>
        </div>

        {/* Table of Staff files */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-150 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                <th className="pb-3 pl-2">Member</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Designation</th>
                <th className="pb-3">Salary Baseline</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr
                  key={emp.id}
                  onClick={() => fetchEmployeeDetails(emp.id)}
                  className={`border-b border-slate-120 border-slate-100 hover:bg-slate-50 cursor-pointer transition ${
                    selectedEmp?.employee.id === emp.id ? 'bg-blue-50/70 hover:bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 pl-2 flex items-center gap-3">
                    <img
                      src={emp.profilePhoto}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                    <div>
                      <div className={`text-xs font-bold ${selectedEmp?.employee.id === emp.id ? 'text-blue-700' : 'text-slate-800'}`}>{emp.name}</div>
                      <span className="text-[10px] text-slate-400">Score: {emp.performanceScore}/100</span>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-slate-600">
                    {departments.find(d => d.id === emp.departmentId)?.name || 'Direct Mapped'}
                  </td>
                  <td className="py-3 text-xs text-slate-600">{emp.designation}</td>
                  <td className="py-3 text-xs font-mono font-bold text-slate-700">
                    ₹{(emp.salary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                  </td>
                  <td className="py-3 text-right pr-2" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      {role !== 'employee' && (
                        <>
                          <button
                            onClick={() => handleOpenEditForm(emp)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            className="p-1 text-slate-400 hover:text-red-650 rounded hover:bg-slate-100 transition"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => fetchEmployeeDetails(emp.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side Drawer Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 text-slate-800">
        {selectedEmp ? (
          <div>
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5 relative">
              <img
                src={selectedEmp.employee.profilePhoto}
                alt={selectedEmp.employee.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">{selectedEmp.employee.name}</h3>
                <span className="text-2xs font-mono text-blue-600 font-bold block mt-0.5 uppercase tracking-wider">
                  {selectedEmp.employee.designation}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Joined: {selectedEmp.employee.joiningDate}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Personal Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-2.5">
                  <UserCheck className="w-3.5 h-3.5" /> PERSONAL DOSSIER
                </h4>
                <div className="space-y-2 text-2xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Gender</span>
                    <span className="font-semibold text-slate-800">{selectedEmp.employee.gender}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{selectedEmp.employee.dob}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Corporate Email</span>
                    <span className="font-semibold text-slate-800">{selectedEmp.employee.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Contact Number</span>
                    <span className="font-semibold text-slate-800">{selectedEmp.employee.phone}</span>
                  </div>
                  <div className="text-slate-600 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-400 font-medium block mb-0.5">Primary Address</span>
                    <span className="font-semibold text-[10px] text-slate-800 block">{selectedEmp.employee.address}</span>
                  </div>
                </div>
              </div>

              {/* Attendance and Score metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <Award className="w-4.5 h-4.5 text-blue-650 text-blue-600 mx-auto mb-1" />
                  <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400 block">Performance</span>
                  <span className="text-base font-bold text-slate-800">{selectedEmp.employee.performanceScore}/100</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <TrendingUp className="w-4.5 h-4.5 text-blue-650 text-blue-600 mx-auto mb-1" />
                  <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400 block">Attendance</span>
                  <span className="text-base font-bold text-slate-100">{selectedEmp.stats.attendanceRate}%</span>
                </div>
              </div>

              {/* Base payslip breakdown list */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">Salary Slip Dossier</span>
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {payslips.filter(p => p.employeeId === selectedEmp.employee.id && p.status === 'Processed').length === 0 ? (
                    <span className="text-slate-400 text-2xs block text-center py-2 font-medium">No processed salary slips found yet.</span>
                  ) : (
                    payslips
                      .filter(p => p.employeeId === selectedEmp.employee.id && p.status === 'Processed')
                      .map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 shadow-3xs">
                          <div>
                            <span className="text-xs font-bold text-slate-700">{p.month}</span>
                            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Basic: ₹{p.basicSalary.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-600">₹{p.netSalary.toLocaleString()}</span>
                            <button
                              onClick={() => handlePrintPayslip(p)}
                              className="p-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded border border-slate-200 transition"
                              title="Print Payslip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 text-slate-400 font-sans border border-dashed border-slate-200 bg-slate-25/50 rounded-xl">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Staff Dossier</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[180px] mx-auto font-medium">Select a staff member from the directory list to load deep personal and salary metrics.</p>
          </div>
        )}
      </div>

      {/* Slide form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Plus className="w-4.5 h-4.5" /> {isEditing ? 'Modify Employee Profile' : 'New Corporate Staff File'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-100" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-950/30 border border-red-500/25 rounded-lg text-red-400 text-2xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Email (Login Identity)</label>
                  <input
                    type="email"
                    required
                    placeholder="emp@corporate.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formDob}
                    onChange={e => setFormDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Performance Score Code</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formPerformance}
                    onChange={e => setFormPerformance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Department</label>
                  <select
                    value={formDeptId}
                    onChange={e => setFormDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="designation"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Phone Contact</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="80000"
                    value={formSalary}
                    onChange={e => setFormSalary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Corporate Address</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Office Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formJoiningDate}
                    onChange={e => setFormJoiningDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-400 font-mono mb-1">Avatar Image Url</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formPhoto}
                    onChange={e => setFormPhoto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-400 uppercase font-mono block">AUTOMATED SECURITY PASSWORD ASSIGNMENT</span>
                  <span className="text-slate-400 text-2xs block">Employees get a default credentials temporary password: <span className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">emp123</span></span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 mt-4"
              >
                💾 Save Dossier File
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
