/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import { Attendance, Employee } from '../types';

interface AttendanceManagerProps {
  token: string;
  role: 'admin' | 'hr' | 'employee';
  currentUserEmployeeId: string | null;
  employees: Employee[];
}

export default function AttendanceManager({ token, role, currentUserEmployeeId, employees }: AttendanceManagerProps) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  // Form states for adding/marking attendance
  const [markEmpId, setMarkEmpId] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markStatus, setMarkStatus] = useState<'Present' | 'Absent' | 'Leave' | 'Work From Home'>('Present');
  const [markOvertime, setMarkOvertime] = useState('0');

  useEffect(() => {
    // Set default employee for filtering if regular employee logged in
    if (role === 'employee' && currentUserEmployeeId) {
      setSelectedEmp(currentUserEmployeeId);
      setMarkEmpId(currentUserEmployeeId);
    } else if (employees.length > 0) {
      setSelectedEmp(employees[0].id);
      setMarkEmpId(employees[0].id);
    }
    fetchAttendance();
  }, [selectedMonth, employees]);

  const fetchAttendance = async () => {
    try {
      let url = `/api/attendance?month=${selectedMonth}`;
      if (role === 'employee' && currentUserEmployeeId) {
        url += `&employeeId=${currentUserEmployeeId}`;
      } else if (selectedEmp) {
        url += `&employeeId=${selectedEmp}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: markEmpId,
          date: markDate,
          status: markStatus,
          overtimeHours: parseInt(markOvertime) || 0
        })
      });

      if (res.ok) {
        setMessage('Attendance logged successfully!');
        fetchAttendance();
        setMarkOvertime('0');
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error || 'Failed log'}`);
      }
    } catch (err) {
      setMessage('Network failure logging attendance.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute stats for current filter
  const totalDays = attendance.length || 1;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const wfhCount = attendance.filter(a => a.status === 'Work From Home').length;
  const leaveCount = attendance.filter(a => a.status === 'Leave').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;

  const totalWorkingDays = presentCount + wfhCount;
  const attendancePercentage = Math.round(((presentCount + wfhCount) / totalDays) * 100);

  const totalOvertime = attendance.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

  // Generate calendar days for selectedMonth
  const getCalendarDays = () => {
    const days: { dateStr: string; dayNum: number; record?: Attendance }[] = [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    
    while (date.getMonth() === month - 1) {
      const dateStr = date.toISOString().split('T')[0];
      const record = attendance.find(a => a.date === dateStr);
      days.push({
        dateStr,
        dayNum: date.getDate(),
        record
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  // Create attendance leaderboard rating (Present/WFH ratio across all employees)
  const getLeaderboard = () => {
    return employees.map(emp => {
      // Find historical records for this month
      const empData = attendance.filter(a => a.employeeId === emp.id);
      const present = empData.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
      const count = empData.length || 1;
      const percentage = Math.round((present / count) * 100);
      const ot = empData.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

      return {
        id: emp.id,
        name: emp.name,
        photo: emp.profilePhoto,
        percentage,
        overtime: ot,
        designation: emp.designation
      };
    }).sort((a, b) => b.percentage - a.percentage || b.overtime - a.overtime);
  };

  const leaderboard = getLeaderboard();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left controls/Mark panel */}
      <div className="space-y-6">
        {/* Attendance Marker Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Corporate Attendance</h3>
          </div>

          <form onSubmit={handleMarkAttendance} className="space-y-4">
            {role !== 'employee' ? (
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Select Employee</label>
                <select
                  value={markEmpId}
                  onChange={e => setMarkEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <span className="text-2xs uppercase font-mono text-slate-400 block mb-1">Logging Identity</span>
                <span className="text-xs font-bold text-blue-600 block pb-2">
                  {employees.find(e => e.id === currentUserEmployeeId)?.name || 'Direct Employee Identity'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Select Date</label>
                <input
                  type="date"
                  required
                  value={markDate}
                  onChange={e => setMarkDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Status Check</label>
                <select
                  value={markStatus}
                  onChange={e => setMarkStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave Request</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>
            </div>

            {(markStatus === 'Present' || markStatus === 'Work From Home') && (
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Registered Overtime (Hours)</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={markOvertime}
                  onChange={e => setMarkOvertime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1 font-medium">Calculates automatic wages at x1.5 contracts multiplier.</span>
              </div>
            )}

            {message && (
              <p className={`p-2.5 rounded-lg text-2xs border font-semibold ${
                message.toLowerCase().includes('success') 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-red-50 border-red-205 text-red-700'
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              📊 Log Clock Activity
            </button>
          </form>
        </div>

        {/* Quick Summary Scorecard Grid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
          <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-blue-600 block">Performance Index Scorecards</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-lg font-extrabold text-slate-800">{attendancePercentage}%</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Overtime Credits</span>
              <span className="text-lg font-extrabold text-slate-800">{totalOvertime} hrs</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-2xs text-slate-650 font-medium pb-1.5 border-b border-slate-100">
              <span className="text-slate-400">Days Present</span>
              <span className="font-bold text-emerald-600">{presentCount}</span>
            </div>
            <div className="flex justify-between text-2xs text-slate-650 font-medium pb-1.5 border-b border-slate-100">
              <span className="text-slate-400">Work From Home</span>
              <span className="font-bold text-indigo-600">{wfhCount}</span>
            </div>
            <div className="flex justify-between text-2xs text-slate-650 font-medium pb-1.5 border-b border-slate-100">
              <span className="text-slate-400">Leave Approvals</span>
              <span className="font-bold text-amber-600">{leaveCount}</span>
            </div>
            <div className="flex justify-between text-2xs text-slate-650 font-medium">
              <span className="text-slate-400">Deficit (Absent)</span>
              <span className="font-bold text-red-650 font-bold text-red-600">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Calendar section */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between text-slate-800">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attendance Calendar Overview</h2>
            </div>
            
            {/* Filter controls */}
            <div className="flex items-center gap-2">
              {role !== 'employee' && (
                <select
                  value={selectedEmp}
                  onChange={e => setSelectedEmp(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Choose Staff filter...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              )}
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calendar grid representation */}
          <div className="grid grid-cols-7 gap-2.5 mb-5 text-center">
            {/* Days heads */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((h, i) => (
              <span key={i} className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase">{h}</span>
            ))}
            
            {/* Real calendar grid details */}
            {calendarDays.map((day, id) => {
              let statusClass = 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800';
              let statusText = '';
              if (day.record) {
                if (day.record.status === 'Present') {
                  statusClass = 'bg-emerald-50 border-emerald-250 text-emerald-800 font-bold';
                  statusText = 'P';
                } else if (day.record.status === 'Work From Home') {
                  statusClass = 'bg-indigo-50 border-indigo-250 text-indigo-800 font-bold';
                  statusText = 'WFH';
                } else if (day.record.status === 'Leave') {
                  statusClass = 'bg-amber-50 border-amber-250 text-amber-800 font-bold';
                  statusText = 'LV';
                } else if (day.record.status === 'Absent') {
                  statusClass = 'bg-red-50 border-red-250 text-red-800 font-bold';
                  statusText = 'AB';
                }
              }

              return (
                <div
                  key={id}
                  className={`border rounded-lg p-2.5 h-14 flex flex-col justify-between text-left transition ${statusClass}`}
                >
                  <span className="text-[10px] font-extrabold font-mono">{day.dayNum}</span>
                  {day.record && (
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[9px] font-bold tracking-wider font-mono uppercase">{statusText}</span>
                      {day.record.overtimeHours > 0 && (
                        <span className="text-[8px] bg-blue-600 text-white font-extrabold px-1.5 rounded shadow-3xs">
                          +{day.record.overtimeHours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] uppercase font-bold font-mono tracking-wider text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-300 inline-block" />
            <span>Present (P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-50 border border-indigo-300 inline-block" />
            <span>Work From Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-300 inline-block" />
            <span>Approved Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-300 inline-block" />
            <span>Absent</span>
          </div>
        </div>
      </div>

    </div>
  );
}
