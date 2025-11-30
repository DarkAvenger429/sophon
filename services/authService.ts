
// Simulated Authentication Service (Mimics Firebase Auth structure)
// In a production environment, you would replace these methods with firebase/auth calls.

export interface User {
    uid: string;
    email: string;
    displayName: string;
    isAnonymous: boolean;
}

const STORAGE_KEY = 'sophon_user_session';

export const authService = {
    // Check if user is logged in on load
    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Simulate Sign In
    signIn: async (email: string, password: string): Promise<User> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!email.includes('@') || password.length < 6) {
            throw new Error("Invalid credentials.");
        }

        // Mock User
        const user: User = {
            uid: 'user_' + Math.random().toString(36).substr(2, 9),
            email: email,
            displayName: email.split('@')[0],
            isAnonymous: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    },

    // Simulate Sign Up
    signUp: async (email: string, password: string): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!email.includes('@')) throw new Error("Invalid email format.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        const user: User = {
            uid: 'user_' + Math.random().toString(36).substr(2, 9),
            email: email,
            displayName: email.split('@')[0],
            isAnonymous: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    },

    // Logout
    signOut: async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        localStorage.removeItem(STORAGE_KEY);
    }
};
