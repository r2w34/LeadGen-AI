
import React, { useState, useEffect } from 'react';
import { User, AuditLog, AdminStats, UserRole } from '../types';
import { getAdminStats, getUsers, getAuditLogs, updateUserRole, suspendUser, inviteUser } from '../services/admin';
import { 
  Shield, Users, Activity, BarChart3, Settings, Search, 
  MoreHorizontal, Download, Filter, UserPlus, Lock, 
  AlertTriangle, CheckCircle, X, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'security' | 'billing'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Member');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsData, usersData, logsData] = await Promise.all([
      getAdminStats(),
      getUsers(),
      getAuditLogs()
    ]);
    setStats(statsData);
    setUsers(usersData);
    setLogs(logsData);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await inviteUser(inviteEmail, inviteRole);
    setShowInviteModal(false);
    setInviteEmail('');
    loadData(); // Refresh
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    await updateUserRole(userId, newRole);
  };

  const handleSuspend = async (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'Suspended' } : u));
    await suspendUser(userId);
  };

  const renderStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>;
      case 'Suspended': return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">Suspended</span>;
      case 'Invited': return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Invited</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
             <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white">Admin Console</h1>
        </div>
        
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
           {[
              { id: 'users', label: 'Team', icon: Users },
              { id: 'activity', label: 'Logs', icon: Activity },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'billing', label: 'Billing', icon: BarChart3 },
           ].map(tab => (
              <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                 <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
           ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         
         {/* Stats Row */}
         <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="text-blue-500" />
            <StatCard label="Active Now" value={stats?.activeNow || 0} icon={Activity} color="text-emerald-500" />
            <StatCard label="Leads Generated" value={stats?.totalLeadsFound.toLocaleString() || 0} icon={Zap} color="text-amber-500" />
            <StatCard label="System Health" value={stats?.systemHealth || 'Unknown'} icon={Shield} color="text-purple-500" />
         </div>

         {/* TAB CONTENT */}
         
         {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Team Management</h2>
                  <div className="flex gap-3">
                     <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                        <input className="bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-rose-500 outline-none" placeholder="Search users..." />
                     </div>
                     <button 
                       onClick={() => setShowInviteModal(true)}
                       className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                     >
                        <UserPlus className="w-4 h-4" /> Invite Member
                     </button>
                  </div>
               </div>

               <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-zinc-900 text-zinc-400 font-medium">
                        <tr>
                           <th className="px-6 py-3">User</th>
                           <th className="px-6 py-3">Role</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3">Last Active</th>
                           <th className="px-6 py-3">Usage</th>
                           <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                           <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                       {user.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                       <div className="font-medium text-white">{user.name}</div>
                                       <div className="text-xs text-zinc-500">{user.email}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <select 
                                    value={user.role} 
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                    className="bg-transparent border-none text-zinc-300 focus:ring-0 cursor-pointer hover:text-white"
                                 >
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Member">Member</option>
                                    <option value="Viewer">Viewer</option>
                                 </select>
                              </td>
                              <td className="px-6 py-4">
                                 {renderStatusBadge(user.status)}
                              </td>
                              <td className="px-6 py-4 text-zinc-400">
                                 {new Date(user.lastLogin).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-zinc-400">
                                 {user.usage.leads} leads
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white">
                                    <MoreHorizontal className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'activity' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">System Logs</h2>
                  <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 border border-white/5 transition-colors">
                     <Download className="w-4 h-4" /> Export CSV
                  </button>
               </div>

               <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                   {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 hover:bg-zinc-800/20 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${log.type === 'error' ? 'bg-rose-500/10 text-rose-500' : log.type === 'security' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                               {log.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : log.type === 'security' ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-sm font-medium text-white">{log.action} <span className="text-zinc-500 font-normal">by {log.user}</span></p>
                               <p className="text-xs text-zinc-500">{log.details}</p>
                            </div>
                         </div>
                         <div className="text-xs text-zinc-500">
                            {new Date(log.timestamp).toLocaleString()}
                         </div>
                      </div>
                   ))}
               </div>
            </div>
         )}

         {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <h2 className="text-xl font-bold text-white">Security Center</h2>
               <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 text-center text-zinc-500">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Security Audit Log & API Management coming soon.</p>
               </div>
            </div>
         )}

         {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <h2 className="text-xl font-bold text-white">Billing & Usage</h2>
               <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 text-center text-zinc-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Subscription and credit usage details coming soon.</p>
               </div>
            </div>
         )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
                  <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                     <input 
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="colleague@company.com"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-zinc-400 mb-1">Role</label>
                     <select 
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as UserRole)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-rose-500"
                     >
                        <option value="Admin">Admin (Full Access)</option>
                        <option value="Manager">Manager (No Billing)</option>
                        <option value="Member">Member (Standard)</option>
                        <option value="Viewer">Viewer (Read Only)</option>
                     </select>
                  </div>
                  
                  <button 
                     onClick={handleInvite}
                     disabled={!inviteEmail}
                     className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
                  >
                     Send Invitation
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
      <div className="flex justify-between items-start mb-2">
         <p className="text-xs text-zinc-500 uppercase font-bold">{label}</p>
         <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
   </div>
);

export default AdminPanel;
