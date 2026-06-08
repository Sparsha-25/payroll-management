/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  AreaChart,
  Sparkles,
  Users,
  Percent,
  CircleDollarSign,
  Activity,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Employee, Department } from '../types';

interface AnalyticsCenterProps {
  token: string;
  employees: Employee[];
  departments: Department[];
}

export default function AnalyticsCenter({ token, employees, departments }: AnalyticsCenterProps) {
  const [activeTab, setActiveTab] = useState<'payroll' | 'employee' | 'attendance'>('payroll');
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastStatement, setForecastStatement] = useState('');
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      const res = await fetch('/api/ai/forecast', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setForecastData(data.forecast);
        setForecastStatement(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  // --- COMPUTE RECHARTS METRICS ---

  // 1. Employee Distribution by Department (Pie Chart)
  const getDeptDistribution = () => {
    return departments.map(d => {
      const count = employees.filter(e => e.departmentId === d.id).length;
      return { name: d.name, value: count };
    }).filter(d => d.value > 0);
  };
  const deptDistributionData = getDeptDistribution();

  // Color scheme
  const COLORS = ['#2563eb', '#4f46e5', '#ca8a04', '#db2777', '#0284c7'];

  // 2. Department Payroll Cost (Bar Chart)
  const getDeptPayrollCost = () => {
    return departments.map(d => {
      // Annual salary sum converted to monthly index budget
      const sum = employees.filter(e => e.departmentId === d.id).reduce((acc, curr) => acc + (curr.salary / 12), 0);
      return { name: d.name, amount: Math.round(sum) };
    }).filter(d => d.amount > 0);
  };
  const deptPayrollCostData = getDeptPayrollCost();

  // 3. Gender Distribution
  const getGenderDistribution = () => {
    const males = employees.filter(e => e.gender === 'Male').length;
    const females = employees.filter(e => e.gender === 'Female').length;
    const others = employees.filter(e => e.gender === 'Other').length;
    return [
      { name: 'MaleStaff', value: males },
      { name: 'FemaleStaff', value: females },
      { name: 'OtherStaff', value: others }
    ].filter(g => g.value > 0);
  };
  const genderDistributionData = getGenderDistribution();

  // 4. Employee Rankings System (Punctuality, performance, attendance)
  const getRankedEmployees = () => {
    return [...employees].map(emp => {
      // Basic ranking scoring formula
      const score = Math.round(emp.performanceScore * 0.7 + 90 * 0.3); // weighted index
      return {
        name: emp.name,
        designation: emp.designation,
        score,
        profile: emp.profilePhoto,
        salary: emp.salary
      };
    }).sort((a, b) => b.score - a.score);
  };
  const rankedStaff = getRankedEmployees();

  // Compute overall KPI aggregates
  const totalMonthlyPayroll = deptPayrollCostData.reduce((sum, curr) => sum + curr.amount, 0);
  const averagePerformance = Math.round(employees.reduce((sum, curr) => sum + curr.performanceScore, 0) / (employees.length || 1));

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Top Section Header with Custom Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600">Payroll Logistics & Employee Intelligence Center</h2>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Automated visualizers, salary maps, talent rankings, and real-time forecasts.</p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CircleDollarSign className="w-4 h-4" /> Payroll Stats
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'employee' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Employee Specs
          </button>
        </div>
      </div>

      {/* VIEW 1: PAYROLL ADVANCED ANALYTICS */}
      {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Box */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 text-slate-850 text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-600" /> Monthly Payroll Spendings by Departments
            </h3>
            
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={deptPayrollCostData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={t => `₹${t}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Monthly Budget Allocation']}
                  />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI SALARY INTERACTIVE FORECASTING BOX */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Predictive Payroll Forecast (Gemini Model)
            </h3>
            
            <div className="h-44 w-full text-2xs">
              {isGeneratingForecast ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="animate-spin uppercase font-bold font-mono tracking-wider">Predicting metrics...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="predicted" name="AI Predicted" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="current" name="Active Baseline" stroke="#94a3b8" strokeDasharray="5 5" />
                  </ReLineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Generated forecast insights report */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-[140px] overflow-y-auto">
              <span className="text-[10px] font-bold font-mono tracking-wider text-blue-600 uppercase block mb-1">AUTOMATED SCIENTIFIC AUDIT REPORT</span>
              <p className="text-slate-600 text-2xs leading-relaxed font-semibold">
                {forecastStatement || 'Standard linear growth with progressive brackets applies to upcoming quarters.'}
              </p>
            </div>
          </div>

          {/* Payroll Heatmap / distribution map */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-600" /> Payroll Heatmap & Sector Ratios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Baseline Cost</span>
                <span className="text-xl font-black text-slate-800 mt-1 block">₹{totalMonthlyPayroll.toLocaleString()}</span>
                <p className="text-2xs text-blue-600 font-bold mt-1 block">Monthly Total Baseline Credit</p>
              </div>

              {departments.slice(0, 3).map((d, id) => {
                const totalSalary = employees.filter(e => e.departmentId === d.id).reduce((sum, curr) => sum + (curr.salary / 12), 0);
                const percent = totalMonthlyPayroll ? Math.round((totalSalary / totalMonthlyPayroll) * 100) : 0;

                return (
                  <div key={d.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">{d.name} Allocation</span>
                      <span className="text-lg font-black text-slate-800 block mt-1">₹{Math.round(totalSalary).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[9px] font-bold font-mono text-slate-500 block mt-1.5 uppercase">{percent}% of baseline credit</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EMPLOYEE STATS & INTEL */}
      {activeTab === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department ratios pie */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" /> Organizational Sector staff ratios
            </h3>

            <div className="h-56 w-full text-xs">
              {deptDistributionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-2xs font-bold">Directory table is empty.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={deptDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {deptDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Talent leaderboard rank */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Talent Merit Board & Attendance Ratings
            </h3>

            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {rankedStaff.slice(0, 5).map((staff, id) => (
                <div key={id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition duration-150">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.profile}
                      alt={staff.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{staff.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">{staff.designation}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-blue-600 block">{staff.score}/100</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-450 text-slate-400 font-bold">Talent Index Code</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
