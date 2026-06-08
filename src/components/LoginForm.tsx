/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, Server, LogIn, Sparkles, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [roleMode, setRoleMode] = useState<'admin' | 'hr' | 'employee'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShortcutLogin = (role: 'admin' | 'hr' | 'employee') => {
    let u = '';
    let p = '';
    if (role === 'admin') {
      u = 'admin@payroll.com';
      p = 'admin123';
    } else if (role === 'hr') {
      u = 'hr@payroll.com';
      p = 'hr123';
    } else {
      u = 'john@payroll.com';
      p = 'emp123';
    }
    setEmail(u);
    setPassword(p);
    setRoleMode(role);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.token) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection failure. Make sure Node.js server.ts has booted correctly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl mb-4 border border-blue-100">
            <Server className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Enterprise HR & Payroll Portal</h2>
          <p className="text-slate-500 text-xs mt-1">Real-Time Employee Administration & Analytics</p>
        </div>

        {/* Demo Fast Login Shortcuts */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider flex items-center gap-1 mb-2.5">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Fast Demo Profiles
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleShortcutLogin('admin')}
              className={`py-1.5 px-1 rounded-lg text-2xs font-bold border transition ${
                email === 'admin@payroll.com'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              System Admin
            </button>
            <button
              onClick={() => handleShortcutLogin('hr')}
              className={`py-1.5 px-1 rounded-lg text-2xs font-bold border transition ${
                email === 'hr@payroll.com'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              HR Manager
            </button>
            <button
              onClick={() => handleShortcutLogin('employee')}
              className={`py-1.5 px-1 rounded-lg text-2xs font-bold border transition ${
                email === 'john@payroll.com'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              CEO / Employee
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-2xs uppercase tracking-wider text-slate-550 text-slate-500 font-mono mb-1.5">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 text-slate-400" />
              <input
                type="email"
                required
                placeholder="john@payroll.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 border-slate-200 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs uppercase tracking-wider text-slate-550 text-slate-500 font-mono mb-1.5">Portal Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-455 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 border-slate-200 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-650 text-red-600 text-2xs bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-550 hover:bg-blue-500 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Verifying Authentication...' : 'Secure Authorization'}
          </button>
        </form>
      </div>
    </div>
  );
}
