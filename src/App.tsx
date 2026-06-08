/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Server,
  Building,
  Users,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CircleDollarSign,
  CalendarDays,
  Bell,
  LogOut,
  UserCheck,
  Award,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Briefcase,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { User, Employee, Department, Attendance, LeaveRequest, Payroll } from './types';
import LoginForm from './components/LoginForm';
import EmployeeManager from './components/EmployeeManager';
import AttendanceManager from './components/AttendanceManager';
import AnalyticsCenter from './components/AnalyticsCenter';
import NotificationDesk from './components/NotificationDesk';
import AIAssistant from './components/AIAssistant';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Core Corporate States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Navigation Panel state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'departments' | 'attendance' | 'leaves' | 'analytics'>('dashboard');

  // Ledger / Payroll compiling modal helper
  const [draftMonth, setDraftMonth] = useState('2026-06');
  const [payrollStatusMsg, setPayrollStatusMsg] = useState('');
  const [isCompilingPayroll, setIsCompilingPayroll] = useState(false);

  // Departments creation states
  const [newDeptName, setNewDeptName] = useState('');
  const [deptFormError, setDeptFormError] = useState('');

  useEffect(() => {
    // Attempt local storage token restore
    const savedToken = localStorage.getItem('payroll_jwt_token');
    const savedUser = localStorage.getItem('payroll_portal_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCentralData();
    }
  }, [token]);

  const fetchCentralData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel reads
      const [resEmp, resDept, resAtt, resLeaves, resPayroll, resNotifs] = await Promise.all([
        fetch('/api/employees', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/attendance', { headers }),
        fetch('/api/leaves', { headers }),
        fetch('/api/payroll', { headers }),
        fetch('/api/notifications', { headers })
      ]);

      if (resEmp.ok) setEmployees(await resEmp.json());
      if (resDept.ok) setDepartments(await resDept.json());
      if (resAtt.ok) setAttendance(await resAtt.json());
      if (resLeaves.ok) setLeaves(await resLeaves.json());
      if (resPayroll.ok) setPayrolls(await resPayroll.json());
      if (resNotifs.ok) setNotifications(await resNotifs.json());

    } catch (e) {
      console.error('Failed reading dashboard states', e);
    }
  };

  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem('payroll_jwt_token', newToken);
    localStorage.setItem('payroll_portal_user', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('payroll_jwt_token');
    localStorage.removeItem('payroll_portal_user');
  };

  // --- AUTOMATED PAYROLL ACTIONS ---
  const handleGenerateDraftPayroll = async () => {
    setIsCompilingPayroll(true);
    setPayrollStatusMsg('');

    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ month: draftMonth })
      });

      const data = await res.json();
      if (res.ok) {
        setPayrollStatusMsg(`Success! ${data.message}`);
        fetchCentralData();
      } else {
        setPayrollStatusMsg(`Notice: ${data.error || 'Already compiled template.'}`);
      }
    } catch (err) {
      setPayrollStatusMsg('Failed contacting automated payroll compiler.');
    } finally {
      setIsCompilingPayroll(false);
    }
  };

  const handleAuthorizeSalaryPayments = async () => {
    setIsCompilingPayroll(true);
    setPayrollStatusMsg('');

    try {
      const res = await fetch(`/api/payroll/process/${draftMonth}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setPayrollStatusMsg(`Processed perfectly! ${data.message}`);
        fetchCentralData();
      } else {
        setPayrollStatusMsg(`Notice: ${data.error || 'Check if draft has been generated.'}`);
      }
    } catch (e) {
      setPayrollStatusMsg('Automation command timed out.');
    } finally {
      setIsCompilingPayroll(false);
    }
  };

  // --- DEPARTMENTS CRUD ACTIONS ---
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError('');
    if (!newDeptName.trim()) return;

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeptName })
      });

      if (res.ok) {
        setNewDeptName('');
        fetchCentralData();
      } else {
        const d = await res.json();
        setDeptFormError(d.error || 'Already exists.');
      }
    } catch (err) {
      setDeptFormError('Network error adding department.');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Do you really want to delete this department?')) return;
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCentralData();
      } else {
        const d = await res.json();
        alert(d.error || 'Error deleting department.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- AGGREGATES COMPILERS ---
  const getActiveEmployeesCount = () => {
    // Any employee having structured records in last 30 days
    return employees.length;
  };

  const getMonthlyPayrollCost = () => {
    // Current active salary cost calculated from contract salaries
    return payrolls.filter(p => p.month === '2026-05' && p.status === 'Processed').reduce((sum, curr) => sum + curr.netSalary, 0) ||
      employees.reduce((sum, curr) => sum + (curr.salary / 12), 0) * 0.82; // dynamic slab factor
  };

  const getAttendancePercentage = () => {
    const juneAtts = attendance.filter(a => a.date.startsWith('2026-06'));
    if (juneAtts.length === 0) return 94; // fallback high performance factor
    const present = juneAtts.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
    return Math.round((present / juneAtts.length) * 100);
  };

  // --- DEPT RECHARTS GENERATOR FOR PRIMARY DASHBOARD ---
  const getDeptDistribution = () => {
    return departments.map(d => {
      const count = employees.filter(e => e.departmentId === d.id).length;
      return { name: d.name, value: count };
    }).filter(d => d.value > 0);
  };
  const deptDistributionData = getDeptDistribution();

  const getDeptPayrollCost = () => {
    return departments.map(d => {
      const sum = employees.filter(e => e.departmentId === d.id).reduce((acc, curr) => acc + (curr.salary / 12), 0);
      return { name: d.name, amount: Math.round(sum) };
    }).filter(d => d.amount > 0);
  };
  const deptPayrollCostData = getDeptPayrollCost();

  const COLORS = ['#2563eb', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6'];

  if (!token || !user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-x-hidden select-none">
      
      {/* Dynamic Voice Assistant Floating Canvas */}
      <AIAssistant token={token} />

      {/* Primary Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-500/10 shadow-sm">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-blue-600 font-bold uppercase block">HR LEDGER PROTOCOL</span>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-800 leading-none">Enterprise Payroll Admin</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Profile Tag */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-800 font-bold leading-none block">{user.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-blue-600 mt-0.5 block">
                  {user.role === 'admin' ? 'System Administrator' : user.role === 'hr' ? 'Strategic HR Specialist' : 'Associate Associate'}
                </span>
              </div>
            </div>

            {/* Notification Badge Bell */}
            <button
              onClick={() => setActiveTab('leaves')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 hover:text-slate-900 relative border border-slate-200 transition"
              title="Notification Records"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl border border-red-200 transition flex items-center gap-1 text-2xs font-bold leading-none"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Nav rail */}
        <aside className="w-full lg:w-60 lg:shrink-0 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-500 block mb-2 px-3">Protocol Modules</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'dashboard' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Building className="w-4 h-4" /> Operations Room
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'employees' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Staff directory
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'departments' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Sectors & Units
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'attendance' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Attendance Log
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'leaves' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Leave & approvals
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition ${
                activeTab === 'analytics' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <BarChartIcon className="w-4 h-4" /> Fiscal Analytics
            </button>
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 block mb-2">Workspace status</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-400 rounded-full border border-blue-500/20 text-2xs font-bold leading-none uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block" />
              Secure Protocol Active
            </div>
            <span className="text-[9px] text-slate-500 block mt-2 font-mono uppercase">Local Time: 2026-06-08</span>
          </div>
        </aside>

        {/* Primary Content panel workspace */}
        <main className="flex-1 space-y-6">
          
          {/* TAB 1: OPERATIONS DOCK (THE MAIN HOME VIEW) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Automated Ledger Generator at Top for Admin/HR */}
              {user.role !== 'employee' && (
                <div className="p-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-800 text-white rounded-xl shadow-md border-b-4 border-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2.5">
                      <CircleDollarSign className="w-5 h-5 text-indigo-200 animate-spin" /> Automated Payroll Compiler ledger
                    </h3>
                    <p className="text-indigo-100 text-xs mt-1 font-medium font-sans">Compile and process direct-deposit payroll slips automatically with auto tax brackets.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 z-10">
                    <input
                      type="month"
                      value={draftMonth}
                      onChange={e => setDraftMonth(e.target.value)}
                      className="bg-indigo-950/60 border border-indigo-400/30 text-white text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:border-white"
                    />
                    <button
                      onClick={handleGenerateDraftPayroll}
                      disabled={isCompilingPayroll}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 transition"
                    >
                      🧪 Compile June Draft
                    </button>
                    <button
                      onClick={handleAuthorizeSalaryPayments}
                      disabled={isCompilingPayroll}
                      className="bg-white text-indigo-750 font-extrabold hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs transition shadow-sm"
                    >
                      🔐 Authorize Final Process
                    </button>
                  </div>
                </div>
              )}

              {payrollStatusMsg && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-2xs">
                  {payrollStatusMsg}
                </div>
              )}

              {/* Bento Grid Dynamic KPI Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Total Staffing</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{employees.length}</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Hired Employees</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Active Status</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{getActiveEmployeesCount()}</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Clocked This Week</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Payroll Cost</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">₹{getMonthlyPayrollCost().toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Monthly Cost Baseline</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Attendance</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{getAttendancePercentage()}%</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Current Month Mean</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Staff Zones</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{departments.length}</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Sectors Tracked</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">Pending Leaves</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{leaves.filter(l => l.status === 'Pending').length}</span>
                  <p className="text-[9px] text-blue-600 font-bold block mt-1">Awaiting Approvals</p>
                </div>
              </div>

              {/* Operations Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sector distribute */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sector Staff Distribution ratios</h4>
                  <div className="h-60 w-full text-xs">
                    {deptDistributionData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-medium">No active employees mapped.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deptDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {deptDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', color: '#475569' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Payroll costs distribute */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Department monthly payroll costs metrics</h4>
                  <div className="h-60 w-full text-xs">
                    {deptPayrollCostData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-medium">Operations baseline is empty.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptPayrollCostData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Monthly Allocation']}
                          />
                          <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STAFF LISTS */}
          {activeTab === 'employees' && (
            <EmployeeManager
              token={token}
              role={user.role}
              currentUserEmployeeId={user.employeeId}
              departments={departments}
            />
          )}

          {/* TAB 3: DEPARTMENTS DOCK */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              {user.role !== 'employee' && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-blue-600" /> Create Corporate Department
                  </h3>
                  
                  <form onSubmit={handleAddDepartment} className="flex gap-2.5 max-w-md">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales, Research & Dev"
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      Create
                    </button>
                  </form>
                  {deptFormError && <p className="text-red-500 text-2xs mt-2">{deptFormError}</p>}
                </div>
              )}

              {/* Sectors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(dept => {
                  const deptStaff = employees.filter(e => e.departmentId === dept.id);
                  const count = deptStaff.length;
                  const manager = deptStaff.find(e => e.designation.toLowerCase().includes('lead') || e.designation.toLowerCase().includes('manager'))?.name || 'Unassigned';

                  return (
                    <div key={dept.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between text-slate-800">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <h4 className="text-sm font-bold text-slate-800">{dept.name}</h4>
                          {user.role !== 'employee' && (
                            <button
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition"
                              title="Delete Sector"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 text-2xs text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Active Staff</span>
                            <span className="font-bold text-blue-600">{count} members</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Sector Leader</span>
                            <span className="font-semibold">{manager}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Budget</span>
                            <span className="font-mono font-bold text-slate-750">
                              ₹{deptStaff.reduce((sum, curr) => sum + (curr.salary / 12), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                            </span>
                          </div>
                        </div>

                        {/* Quick View Mini list */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block mb-2">Team List Preview</span>
                          <div className="flex -space-x-2 overflow-hidden">
                            {deptStaff.slice(0, 4).map(e => (
                              <img
                                key={e.id}
                                src={e.profilePhoto}
                                alt={e.name}
                                referrerPolicy="no-referrer"
                                className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white border border-slate-250 object-cover"
                                title={e.name}
                              />
                            ))}
                            {count > 4 && (
                              <span className="h-6.5 w-6.5 rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">
                                +{count - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE CLOCKS */}
          {activeTab === 'attendance' && (
            <AttendanceManager
              token={token}
              role={user.role}
              currentUserEmployeeId={user.employeeId}
              employees={employees}
            />
          )}

          {/* TAB 5: LEAVES approvals */}
          {activeTab === 'leaves' && (
            <NotificationDesk
              token={token}
              role={user.role}
              currentUserEmployeeId={user.employeeId}
              employees={employees}
            />
          )}

          {/* TAB 6: FISCAL RECHARTS INTEL */}
          {activeTab === 'analytics' && (
            <AnalyticsCenter
              token={token}
              employees={employees}
              departments={departments}
            />
          )}

        </main>
      </div>
    </div>
  );
}
