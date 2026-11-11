import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Pastikan membaca .env dari folder backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('[Supabase Config] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terdefinisi di file .env');
}

/**
 * Supabase Admin Client dengan wewenang Service Role.
 * Digunakan pada backend untuk:
 * 1. Bypass RLS pada proses bulk import data SIPD.
 * 2. Mengelola akun Auth pengguna (Admin user management).
 * 3. Mengambil profil & audit log sistem.
 * 
 * Menggunakan dummy transport untuk WebSocket agar stabil pada semua versi Node.js.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    transport: class DummyWS {}
  }
});

/**
 * Helper untuk membuat instance Supabase Client dengan token pengguna (Scoper Client)
 * jika dibutuhkan eksekusi sesuai RLS pengguna aktif.
 */
export const createUserClient = (accessToken) => {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    realtime: {
      transport: class DummyWS {}
    }
  });
};

export default supabaseAdmin;

