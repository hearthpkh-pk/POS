// src/js/services/auth.js
import { supabase } from '../core/SupabaseClient.js';

/**
 * Login using phone number (OTP) – Supabase auth method.
 * Returns the Supabase auth session.
 */
export async function loginWithPhone(phone) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(`ไม่สามารถส่ง OTP ได้: ${error.message}`);
  // Supabase will handle OTP flow; after verification, session is set.
  return supabase.auth.getSession();
}

/** Get current authenticated user */
export function getUser() {
  const user = supabase.auth.user();
  return user;
}

/** Logout */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`ออกจากระบบไม่สำเร็จ: ${error.message}`);
}
