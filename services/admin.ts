
import { User, AuditLog, AdminStats, UserRole } from '../types';

// Mock Data Generators

const NAMES = ['Alex Chen', 'Sarah Jones', 'Mike Ross', 'Emily Blunt', 'David Kim', 'Jessica Pearson'];
const ROLES: UserRole[] = ['Admin', 'Manager', 'Member', 'Viewer'];
const ACTIONS = ['Login', 'Export Leads', 'Updated Settings', 'Ran Scan', 'Deleted Lead', 'Invited User'];

export const getAdminStats = async (): Promise<AdminStats> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        totalUsers: 14,
        activeNow: 4,
        totalLeadsFound: 12450,
        apiUsage: 68,
        systemHealth: 'Healthy'
      });
    }, 500);
  });
};

export const getUsers = async (): Promise<User[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const users: User[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `user-${i}`,
        name: NAMES[i % NAMES.length],
        email: `${NAMES[i % NAMES.length].toLowerCase().replace(' ', '.')}@company.com`,
        role: i === 0 ? 'Admin' : ROLES[Math.floor(Math.random() * ROLES.length)],
        status: i === 3 ? 'Suspended' : i === 7 ? 'Invited' : 'Active',
        lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(),
        usage: {
          scans: Math.floor(Math.random() * 500),
          leads: Math.floor(Math.random() * 2000)
        }
      }));
      resolve(users);
    }, 600);
  });
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const logs: AuditLog[] = Array.from({ length: 15 }).map((_, i) => ({
        id: `log-${i}`,
        user: NAMES[Math.floor(Math.random() * NAMES.length)],
        action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
        details: 'Performed operation via dashboard',
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
        type: Math.random() > 0.9 ? 'error' : Math.random() > 0.8 ? 'security' : 'action'
      }));
      resolve(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, 400);
  });
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  return new Promise(resolve => setTimeout(() => resolve(true), 300));
};

export const suspendUser = async (userId: string): Promise<boolean> => {
  return new Promise(resolve => setTimeout(() => resolve(true), 300));
};

export const inviteUser = async (email: string, role: UserRole): Promise<boolean> => {
  return new Promise(resolve => setTimeout(() => resolve(true), 500));
};
