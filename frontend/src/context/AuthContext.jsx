import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi sinkronisasi profil pengguna dari backend
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response?.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('[AuthContext] Gagal mengambil profil pengguna:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Cek sesi saat pertama kali aplikasi dibuka
    const initSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile();
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error inisialisasi sesi:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Berlangganan perubahan status autentikasi Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fungsi Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    setUser(data.user);
    await fetchUserProfile();
    return data;
  };

  // Fungsi Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    role: profile?.role || null,
    opd: profile?.opd || null,
    loading,
    isAuthenticated: !!user && !!profile,
    login,
    logout,
    refreshProfile: fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

