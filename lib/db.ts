
import { 
  Lead, UserSettings, BusinessProfile, OutreachTemplate, 
  OutreachCampaign, OutreachSequence, SMTPConfig, LeadList, 
  SavedSearch, Alert, User, DeepResearch 
} from '../types';

const DB_NAME = 'LeadGenAI_DB';
const DB_VERSION = 4;

class Database {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    // Singleton Promise Pattern: return existing promise if initialization is already in flight
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        console.error("DB Open Error:", request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        const stores = [
          'leads', 'settings', 'profile', 'research', 
          'templates', 'campaigns', 'sequences', 'smtp',
          'lists', 'searches', 'alerts', 'users', 'session'
        ];

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };
    });

    return this.initPromise;
  }

  private async ensureInit(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  // --- Crypto Helpers ---
  
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const encoder = new TextEncoder();
    const existingSalt = salt ? Uint8Array.from(atob(salt), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
    const passData = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      "raw", 
      passData, 
      { name: "PBKDF2" }, 
      false, 
      ["deriveBits", "deriveKey"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: existingSalt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      256
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltString = btoa(String.fromCharCode(...existingSalt));
    
    return { hash: hashHex, salt: saltString };
  }

  async verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
    const { hash } = await this.hashPassword(password, storedSalt);
    return hash === storedHash;
  }

  // --- Generic Transaction Helper ---

  private async tx<T>(storeName: string, mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) throw new Error("DB not initialized");
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = op(store);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  // --- Auth & User ---

  async saveUser(user: User): Promise<void> {
    await this.tx('users', 'readwrite', store => store.put(user));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getAll('users');
    return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  }

  async registerUser(name: string, email: string, password: string): Promise<User> {
    const existing = await this.getUserByEmail(email);
    if (existing) throw new Error("Email already registered.");

    const { hash, salt } = await this.hashPassword(password);

    const newUser: User = {
      id: `user-manual-${Date.now()}`,
      name,
      email,
      passwordHash: hash,
      salt: salt,
      role: 'Admin',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      provider: 'email',
      usage: { scans: 0, leads: 0 }
    };

    await this.saveUser(newUser);
    return newUser;
  }

  async loginUser(email: string, password: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new Error("Invalid credentials.");
    
    if (!user.passwordHash || !user.salt) {
       return user; // Fallback for mock/google users
    }

    const isValid = await this.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) throw new Error("Invalid credentials.");

    user.lastLogin = new Date().toISOString();
    await this.saveUser(user);
    return user;
  }

  async saveSession(user: User): Promise<void> {
    await this.tx('session', 'readwrite', store => store.put({ id: 'active', user, timestamp: Date.now() }));
  }

  async getSession(): Promise<User | null> {
    const session = await this.tx<{ id: string, user: User }>('session', 'readonly', store => store.get('active'));
    return session ? session.user : null;
  }

  async clearSession(): Promise<void> {
    await this.tx('session', 'readwrite', store => store.delete('active'));
  }

  // --- Feature Data ---

  async saveLeads(leads: Lead[]): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;
    const tx = this.db.transaction('leads', 'readwrite');
    const store = tx.objectStore('leads');
    leads.forEach(lead => store.put(lead));
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  }

  async getLeads(): Promise<Lead[]> {
    return this.getAll('leads');
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.tx('settings', 'readwrite', store => store.put({ id: 'user_settings', ...settings }));
  }

  async getSettings(): Promise<UserSettings | null> {
    const res = await this.tx<any>('settings', 'readonly', store => store.get('user_settings'));
    if (res) { const { id, ...rest } = res; return rest as UserSettings; }
    return null;
  }

  async saveProfile(profile: BusinessProfile): Promise<void> {
    await this.tx('profile', 'readwrite', store => store.put({ id: 'business_profile', ...profile }));
  }

  async getProfile(): Promise<BusinessProfile | null> {
    const res = await this.tx<any>('profile', 'readonly', store => store.get('business_profile'));
    if (res) { const { id, ...rest } = res; return rest as BusinessProfile; }
    return null;
  }
  
  async saveResearch(research: DeepResearch): Promise<void> {
    await this.tx('research', 'readwrite', store => store.put({ id: 'deep_research', ...research }));
  }

  async getResearch(): Promise<DeepResearch | null> {
    const res = await this.tx<any>('research', 'readonly', store => store.get('deep_research'));
    if (res) { const { id, ...rest } = res; return rest as DeepResearch; }
    return null;
  }

  // --- Outreach ---

  async saveTemplates(templates: OutreachTemplate[]): Promise<void> {
    await this.ensureInit();
    if(!this.db) return;
    const tx = this.db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    templates.forEach(t => store.put(t));
  }

  async getTemplates(): Promise<OutreachTemplate[]> {
    return this.getAll('templates');
  }

  async saveCampaigns(campaigns: OutreachCampaign[]): Promise<void> {
    await this.ensureInit();
    if(!this.db) return;
    const tx = this.db.transaction('campaigns', 'readwrite');
    const store = tx.objectStore('campaigns');
    campaigns.forEach(c => store.put(c));
  }

  async getCampaigns(): Promise<OutreachCampaign[]> {
    return this.getAll('campaigns');
  }

  async saveSequences(sequences: OutreachSequence[]): Promise<void> {
    await this.ensureInit();
    if(!this.db) return;
    const tx = this.db.transaction('sequences', 'readwrite');
    const store = tx.objectStore('sequences');
    sequences.forEach(s => store.put(s));
  }

  async getSequences(): Promise<OutreachSequence[]> {
    return this.getAll('sequences');
  }

  async saveSMTPConfig(config: SMTPConfig): Promise<void> {
    await this.tx('smtp', 'readwrite', store => store.put({ id: 'config', ...config }));
  }

  async getSMTPConfig(): Promise<SMTPConfig | null> {
    const res = await this.tx<any>('smtp', 'readonly', store => store.get('config'));
    if (res) { const { id, ...rest } = res; return rest as SMTPConfig; }
    return null;
  }

  // --- Lists & Search ---

  async saveLists(lists: LeadList[]): Promise<void> {
    await this.ensureInit();
    if(!this.db) return;
    const tx = this.db.transaction('lists', 'readwrite');
    const store = tx.objectStore('lists');
    lists.forEach(l => store.put(l));
  }

  async getLists(): Promise<LeadList[]> {
    return this.getAll('lists');
  }

  async saveSearches(searches: SavedSearch[]): Promise<void> {
    await this.ensureInit();
    if(!this.db) return;
    const tx = this.db.transaction('searches', 'readwrite');
    const store = tx.objectStore('searches');
    searches.forEach(s => store.put(s));
  }

  async getSearches(): Promise<SavedSearch[]> {
    return this.getAll('searches');
  }
  
  async saveAlerts(alerts: Alert[]): Promise<void> {
     await this.ensureInit();
     if(!this.db) return;
     const tx = this.db.transaction('alerts', 'readwrite');
     const store = tx.objectStore('alerts');
     alerts.forEach(a => store.put(a));
  }
  
  async getAlerts(): Promise<Alert[]> {
     return this.getAll('alerts');
  }

  // --- Generic Get All ---
  private async getAll(storeName: string): Promise<any[]> {
    return this.tx(storeName, 'readonly', store => store.getAll());
  }
}

export const db = new Database();
