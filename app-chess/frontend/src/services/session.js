import { authAPI } from './api';

const SESSION_KEY = 'chess_session';
const TOKEN_KEY = 'chess_token';
const USER_KEY = 'chess_user';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const CHECK_INTERVAL = 5 * 60 * 1000; // Check session every 5 minutes

class SessionManager {
  constructor() {
    this.listeners = new Set();
    this.checkTimer = null;
    this.currentUser = null;
    this.currentToken = null;
    this.isValidating = false;
  }

  // Initialize session from stored data
  async init() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const sessionJson = localStorage.getItem(SESSION_KEY);

    if (!token || !userJson) {
      this.clear();
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      const session = sessionJson ? JSON.parse(sessionJson) : null;

      // Check if session has expired
      if (session && Date.now() > session.expiresAt) {
        this.clear();
        this.notifyListeners({ type: 'SESSION_EXPIRED' });
        return null;
      }

      this.currentToken = token;
      this.currentUser = user;

      // Validate token with backend
      this.isValidating = true;
      this.notifyListeners({ type: 'SESSION_VALIDATING' });

      try {
        const res = await authAPI.profile();
        const profile = res.data.data;
        
        // Update stored user data with latest from server
        const updatedUser = { ...user, ...profile };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        this.currentUser = updatedUser;
        
        // Refresh session expiry
        this.refreshSession();
        
        this.isValidating = false;
        this.notifyListeners({ type: 'SESSION_RESTORED', user: updatedUser, token });
        
        // Start periodic session check
        this.startPeriodicCheck();
        
        return { user: updatedUser, token };
      } catch (err) {
        // Token invalid or server unreachable
        this.isValidating = false;
        
        if (err.response && err.response.status === 401) {
          // Token is invalid, clear session
          this.clear();
          this.notifyListeners({ type: 'SESSION_INVALID' });
          return null;
        }
        
        // Server might be down, use cached session
        this.notifyListeners({ type: 'SESSION_CACHED', user, token });
        return { user, token };
      }
    } catch (e) {
      this.clear();
      return null;
    }
  }

  // Create a new session after login/register
  create(user, token) {
    this.currentUser = user;
    this.currentToken = token;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.refreshSession();
    
    this.notifyListeners({ type: 'SESSION_CREATED', user, token });
    this.startPeriodicCheck();
  }

  // Refresh session expiry timestamp
  refreshSession() {
    const session = {
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  // Clear all session data
  clear() {
    this.currentUser = null;
    this.currentToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.stopPeriodicCheck();
  }

  // Periodic session check
  startPeriodicCheck() {
    this.stopPeriodicCheck();
    this.checkTimer = setInterval(() => {
      const sessionJson = localStorage.getItem(SESSION_KEY);
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        if (Date.now() > session.expiresAt) {
          this.clear();
          this.notifyListeners({ type: 'SESSION_EXPIRED' });
        }
      }
    }, CHECK_INTERVAL);
  }

  stopPeriodicCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentToken && !!this.currentUser;
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Get current token
  getToken() {
    return this.currentToken;
  }

  // Subscribe to session changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Session listener error:', e);
      }
    });
  }

  // Logout
  logout() {
    this.clear();
    this.notifyListeners({ type: 'SESSION_LOGGED_OUT' });
  }
}

// Singleton instance
const sessionManager = new SessionManager();

export default sessionManager;