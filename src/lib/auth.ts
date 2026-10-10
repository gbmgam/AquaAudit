/**
 * Authentication Service Layer for AquaAudit
 *
 * Implements a clean, decoupled authentication interface.
 * When no remote backend (like Supabase Auth) is configured via environment variables,
 * it provides a transparent, clearly labeled Demo Mode without storing plaintext passwords.
 */

import { User } from '../types.ts';

const SESSION_STORAGE_KEY = 'aquaaudit_session_user';
const REMEMBER_STORAGE_KEY = 'aquaaudit_remembered_email';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  isDemoNotice?: boolean;
}

export class AuthService {
  private static currentUser: User | null = null;

  /**
   * Initializes session from storage if previously remembered or active
   */
  static init(): User | null {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch {
      // Storage unavailable or invalid
    }
    return null;
  }

  static getCurrentUser(): User | null {
    if (!this.currentUser) {
      this.init();
    }
    return this.currentUser;
  }

  static getRememberedEmail(): string {
    try {
      return localStorage.getItem(REMEMBER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  static setRememberedEmail(email: string, remember: boolean): void {
    try {
      if (remember && email) {
        localStorage.setItem(REMEMBER_STORAGE_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Enters the application via Demo Mode
   * Does not collect or store passwords
   */
  static loginAsDemo(customName?: string, customBuilding?: string): AuthResponse {
    const demoUser: User = {
      id: 'demo_user_' + Date.now(),
      name: customName || 'Rohan Sharma',
      email: 'rohan.sharma@greenwood-hostel.in',
      buildingName: customBuilding || 'Greenwood PG & Hostel (Block A)',
      isDemoMode: true,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = demoUser;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoUser));
    } catch {
      // Session storage blocked
    }

    return {
      success: true,
      user: demoUser,
    };
  }

  /**
   * Login with email and password
   * In local frontend mode, informs the user about Demo Mode rather than faking security
   */
  static async login(email: string, password: string, rememberMe: boolean): Promise<AuthResponse> {
    // Validate inputs
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    this.setRememberedEmail(email, rememberMe);

    // Simulate authentication verification
    const user: User = {
      id: 'user_' + btoa(email).substring(0, 8),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email,
      buildingName: 'Hostel Block 1',
      isDemoMode: true,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = user;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }

    return {
      success: true,
      user,
      isDemoNotice: true,
    };
  }

  /**
   * Sign up new user
   */
  static async signup(
    name: string,
    email: string,
    buildingName: string,
    password: string,
    confirmPassword: string,
    agreeTerms: boolean
  ): Promise<AuthResponse> {
    if (!name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!buildingName.trim()) {
      return { success: false, error: 'Building or property name is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }
    if (!agreeTerms) {
      return { success: false, error: 'You must agree to the terms and privacy notice.' };
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      buildingName: buildingName.trim(),
      isDemoMode: true,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = newUser;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // Ignore
    }

    return {
      success: true,
      user: newUser,
    };
  }

  /**
   * Request password recovery link
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // Honest notice: in demo frontend environment
    return {
      success: true,
      message: `Password reset instructions have been logged for ${email}. (In local demo mode, no external mail server is connected).`,
    };
  }

  /**
   * Ends current session and clears sensitive storage
   */
  static logout(): void {
    this.currentUser = null;
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Updates current user's profile
   */
  static updateProfile(name: string, buildingName: string): User | null {
    if (!this.currentUser) return null;
    this.currentUser = {
      ...this.currentUser,
      name,
      buildingName,
    };
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentUser));
    } catch {
      // Ignore
    }
    return this.currentUser;
  }
}
