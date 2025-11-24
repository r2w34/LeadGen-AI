// Frontend API Client for PostgreSQL Backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class APIClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async signup(email: string, password: string, name: string) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getCurrentUser() {
    return await this.request('/api/auth/me');
  }

  // Lead endpoints
  async getLeads(filters?: { status?: string; stage?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any);
    return await this.request(`/api/leads?${params}`);
  }

  async generateLeads(filters: { industry?: string; location?: string; companySize?: string }) {
    return await this.request('/api/leads/generate', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  async createLead(lead: any) {
    return await this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async getLead(id: string) {
    return await this.request(`/api/leads/${id}`);
  }

  async updateLead(id: string, updates: any) {
    return await this.request(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string) {
    return await this.request(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Email endpoints (to be implemented)
  async sendEmail(email: any) {
    return await this.request('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(email),
    });
  }

  async getEmailTemplates() {
    return await this.request('/api/email/templates');
  }

  async createEmailTemplate(template: any) {
    return await this.request('/api/email/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  // Company endpoints
  async analyzeCompany(companyName: string, website?: string) {
    return await this.request('/api/company/analyze', {
      method: 'POST',
      body: JSON.stringify({ companyName, website }),
    });
  }

  // User endpoints
  async getUserProfile() {
    return await this.request('/api/user/profile');
  }

  async updateUserProfile(updates: any) {
    return await this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getUserStats() {
    return await this.request('/api/user/stats');
  }
}

// Export singleton instance
export const api = new APIClient(API_URL);
export default api;
