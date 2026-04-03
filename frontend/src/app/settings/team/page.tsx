'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import {
  Users, UserPlus, Trash2, Shield, ShieldCheck,
  CheckCircle2, AlertCircle, Loader2, X, AlertTriangle
} from 'lucide-react';

interface OrgUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager';
  created_at: string;
}

const roleBadge = (role: string) =>
  role === 'admin'
    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50';

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-slate-400";

export default function TeamSettingsPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [users, setUsers]         = useState<OrgUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'manager',
  });

  useEffect(() => {
    if (!user?.id) return;
    setCurrentUserId(user.id);
  }, [user]);

  useEffect(() => {
    if (userLoading) return;
    if (user?.role !== 'admin') {
      setLoading(false);
      setError('Only admins can manage team members.');
      return;
    }

    fetchUsers();
  }, [user, userLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/org/users');
      setUsers(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Only admins can manage team members.');
      } else {
        setError(err.response?.data?.error || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/org/users', form);
      setForm({ fullName: '', email: '', password: '', role: 'manager' });
      setShowForm(false);
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/org/users/${userId}/role`, { role: newRole });
      setUsers(u => u.map(usr => usr.id === userId ? { ...usr, role: newRole as 'admin' | 'manager' } : usr));
      setSuccess('Role updated');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your organization?`)) return;
    try {
      await api.delete(`/api/org/users/${userId}`);
      setUsers(u => u.filter(usr => usr.id !== userId));
      setSuccess('User removed');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove user');
    }
  };

  if (userLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading team settings...</p>
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 flex items-start gap-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Access Restricted</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">Admin access is required to manage team members.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">

        {/* --- Header --- */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Team Management</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">
              Manage who has access to your organization.
            </p>
          </div>
        </div>

        {/* --- Feedback Banners --- */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between text-red-600 dark:text-red-400 text-sm font-medium shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} />{error}
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium shadow-sm">
            <CheckCircle2 size={16} />{success}
          </div>
        )}

        {/* --- User List Card --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white text-base tracking-tight">Members</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-0.5">
                {users.length} user{users.length !== 1 ? 's' : ''} in your organization
              </p>
            </div>
            <button
              onClick={() => setShowForm(s => !s)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95 w-full sm:w-auto"
            >
              {showForm ? <X size={16} /> : <UserPlus size={16} />}
              {showForm ? 'Cancel' : 'Add Member'}
            </button>
          </div>

          {/* Add member form */}
          {showForm && (
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10 animate-in slide-in-from-top-2 duration-300">
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input className={inputCls} placeholder="Jane Doe" value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input className={inputCls} type="email" placeholder="jane@acme.com" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                  <input className={inputCls} type="password" placeholder="At least 10 chars" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Account Role</label>
                  <select className={`${inputCls} appearance-none cursor-pointer`} value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2 pt-2 flex justify-end">
                  <button type="submit" disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 active:scale-95 disabled:active:scale-100 shadow-sm">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={24} />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {users.map(user => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-medium flex-shrink-0">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name}</p>
                        {user.id === currentUserId && (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded uppercase tracking-widest">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-normal">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    {/* Role selector */}
                    {user.id !== currentUserId ? (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-slate-400 transition-colors cursor-pointer"
                      >
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-medium px-3 py-1.5 rounded-lg ${roleBadge(user.role)}`}>
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1.5"><ShieldCheck size={14} />Admin</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Shield size={14} />Manager</span>
                        )}
                      </span>
                    )}

                    {/* Remove button — not shown for current user */}
                    {user.id !== currentUserId ? (
                      <button
                        onClick={() => handleRemove(user.id, user.full_name)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100"
                        title="Remove user"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div className="w-8"></div> /* Spacer to keep layout aligned */
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Role Explanation Card --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
            <h3 className="font-medium text-slate-900 dark:text-white text-base tracking-tight">Role Permissions</h3>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  role: 'Admin', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/50',
                  perms: ['All events (not just their own)', 'Email templates & integrations', 'Danger zone & billing', 'Team management'],
                },
                {
                  role: 'Manager', icon: Shield, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50',
                  perms: ['Own events only', 'Attendee management', 'Analytics (own events)', 'Calendar exports'],
                },
              ].map(({ role, icon: Icon, color, bg, perms }) => (
                <div key={role} className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${bg}`}>
                    <Icon size={14} className={color} />
                    <span className={`text-xs font-medium ${color}`}>{role}</span>
                  </div>
                  <ul className="space-y-2">
                    {perms.map(p => (
                      <li key={p} className="flex items-center gap-2.5 text-sm font-normal text-slate-500 dark:text-slate-400">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}