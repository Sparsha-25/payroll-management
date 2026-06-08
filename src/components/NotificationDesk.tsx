/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  CalendarDays,
  Send,
  Lock
} from 'lucide-react';
import { LeaveRequest, Notification } from '../types';

interface NotificationDeskProps {
  token: string;
  role: 'admin' | 'hr' | 'employee';
  currentUserEmployeeId: string | null;
  employees: any[];
}

export default function NotificationDesk({ token, role, currentUserEmployeeId, employees }: NotificationDeskProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'leaves'>('leaves');
  const [sysMsg, setSysMsg] = useState('');

  // Apply Leave form state
  const [leaveType, setLeaveType] = useState<'Casual Leave' | 'Sick Leave' | 'Earned Leave'>('Casual Leave');
  const [startDate, setStartDate] = useState('2026-06-15');
  const [endDate, setEndDate] = useState('2026-06-18');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchLeaves();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    try {
      let url = '/api/leaves';
      if (role === 'employee' && currentUserEmployeeId) {
        url += `?employeeId=${currentUserEmployeeId}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserEmployeeId) return;
    setSysMsg('');

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: currentUserEmployeeId,
          leaveType,
          startDate,
          endDate,
          reason
        })
      });

      if (res.ok) {
        setSysMsg('Leave slot requested successfully.');
        setReason('');
        fetchLeaves();
      } else {
        const d = await res.json();
        setSysMsg(`Error: ${d.error || 'Failed request'}`);
      }
    } catch (err) {
      setSysMsg('Network fail applying leave.');
    }
  };

  const handleProcessLeave = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchLeaves();
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800">
      
      {/* Interactive Desk Column Left */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave Allocation & approvals panel</h2>
          </div>

          <div className="inline-flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-2xs">
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1 rounded transition font-bold ${activeTab === 'leaves' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              Leaves List
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1 rounded transition relative font-bold ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              Feed
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: ALL LEAVES LISTINGS */}
        {activeTab === 'leaves' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-150 text-2xs uppercase tracking-wider text-slate-400 font-mono">
                    <th className="pb-3 pl-2">Applicant</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Duration (Dates)</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3">Status</th>
                    {role !== 'employee' && <th className="pb-3 text-right pr-2">Ledger Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-2xs font-mono font-semibold">Leaves document list is completely empty.</td>
                    </tr>
                  ) : (
                    leaves.map((l: any) => (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 pl-2 text-xs font-bold text-slate-800">
                          {l.employeeName || 'Corporate Specialist'}
                        </td>
                        <td className="py-3 text-xs">
                          <span className="px-2 py-0.5 text-[10px] rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase">
                            {l.leaveType}
                          </span>
                        </td>
                        <td className="py-3 text-xs font-mono font-semibold text-slate-700">
                          {l.startDate} to {l.endDate}
                        </td>
                        <td className="py-3 text-xs text-slate-500 italic">
                          "{l.reason}"
                        </td>
                        <td className="py-3 text-xs">
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            l.status === 'Approved' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                            l.status === 'Rejected' ? 'bg-red-50 border border-red-200 text-red-700' :
                            'bg-amber-50 border border-amber-200 text-amber-700'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        {role !== 'employee' && (
                          <td className="py-3 text-right pr-2">
                            {l.status === 'Pending' ? (
                              <div className="inline-flex gap-1">
                                <button
                                  onClick={() => handleProcessLeave(l.id, 'Approved')}
                                  className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded transition"
                                  title="Approve"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleProcessLeave(l.id, 'Rejected')}
                                  className="p-1 bg-red-50 text-red-700 hover:bg-red-500 hover:text-white rounded transition"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-2xs text-slate-400 font-bold">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM WORK LOG / NOTIFICATION HISTORICAL FEED */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-slate-800">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">Alert Logs Feed Archive</span>
              <button
                onClick={handleClearNotifications}
                className="text-2xs font-bold text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-2xs font-mono font-semibold">No new alert notices.</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border flex gap-3 transition ${
                      n.read ? 'bg-slate-50 border-slate-150 text-slate-500' : 'bg-blue-50/50 border-blue-150 text-slate-800'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                      <Bell className="w-4 h-4 text-blue-600 shrink-0 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-normal">{n.title}</div>
                      <p className="text-2xs text-slate-500 mt-1">{n.message}</p>
                      <span className="text-[9px] font-mono text-slate-400 block mt-1.5">{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR COLUMN: Apply Leave panel for Employees */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between text-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-150 pb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Application Protocol</h3>
          </div>

          {role === 'employee' ? (
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Leave Type Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as any)}
                  className="w-full bg-slate-5/40 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Casual Leave">Casual Leave (General Admin)</option>
                  <option value="Sick Leave">Sick Leave (Medical protocols)</option>
                  <option value="Earned Leave">Earned Leave (Privilege accrued)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs uppercase tracking-wider text-slate-500 font-mono mb-1.5 font-bold">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs uppercase tracking-wider text-slate-505 text-slate-500 font-mono mb-1.5 font-bold">State Reason for Absence</label>
                <textarea
                  required
                  placeholder="State clear reasons so management can process..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {sysMsg && (
                <div className={`p-2.5 rounded-lg text-2xs border font-bold ${
                  sysMsg.toLowerCase().includes('success') 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {sysMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" /> Apply Session Lock
              </button>
            </form>
          ) : (
            <div className="text-center py-20 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl space-y-4">
              <Lock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Apply Disabled</h4>
              <p className="text-2xs text-slate-500 max-w-[200px] mx-auto font-semibold">
                Only regular staff accounts mapped to the Employee role can initiate primary leave applications. Admins process queries.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
