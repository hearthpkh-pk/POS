import { createClient } from '@supabase/supabase-js';

// Configuration variables from Environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing from environment variables.');
    // Throwing an error could break the app entirely, falling back to a dummy client for UI testing might be an option, but for SaaS, this must fail loudly.
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase Service Wrapper
 * Provides a standardized way to interact with the database tables.
 */
class SupabaseService {
    /**
     * Get the current authenticated user's session
     */
    static async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        return data.session;
    }

    /**
     * Generic error handler for Supabase requests
     */
    static handleError(error, context = '') {
        console.error(`Supabase Error (${context}):`, error.message, error.details);
        throw new Error(error.message);
    }
}

export default SupabaseService;
