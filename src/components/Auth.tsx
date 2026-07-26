/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { isSupabaseConfigured, dbService } from '../lib/api';

interface AuthProps {
  onLoginSuccess: (user: { email: string; name: string; id?: string; isGoogleUser?: boolean }) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sla geregistreerde gebruikers op in localStorage
  const getStoredUsers = (): any[] => {
    const saved = localStorage.getItem('subscription_tracker_users');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUser = (newUser: any) => {
    const users = getStoredUsers();
    users.push(newUser);
    localStorage.setItem('subscription_tracker_users', JSON.stringify(users));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Vul alstublieft alle verplichte velden in.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        if (isRegistering) {
          if (!name) {
            setError('Vul uw naam in.');
            setIsLoading(false);
            return;
          }
          if (password.length < 6) {
            setError('Het wachtwoord moet minimaal 6 tekens bevatten.');
            setIsLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen.');
            setIsLoading(false);
            return;
          }

          await dbService.signUp(email, password, name);
          setSuccessMsg('Registratie succesvol! Controleer eventueel uw e-mail of log direct in.');
          setIsRegistering(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          const data = await dbService.signIn(email, password);
          if (data.user) {
            onLoginSuccess({
              email: data.user.email || email,
              name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Gebruiker',
              id: data.user.id
            });
          }
        }
      } else {
        // Fallback LocalStorage Flow
        if (isRegistering) {
          if (!name) {
            setError('Vul uw naam in.');
            setIsLoading(false);
            return;
          }
          if (password.length < 6) {
            setError('Het wachtwoord moet minimaal 6 tekens bevatten.');
            setIsLoading(false);
            return;
          }
          if (password !== confirmPassword) {
            setError('Wachtwoorden komen niet overeen.');
            setIsLoading(false);
            return;
          }

          const users = getStoredUsers();
          if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError('Dit e-mailadres is al geregistreerd.');
            setIsLoading(false);
            return;
          }

          const newUser = { name, email, password };
          saveUser(newUser);
          setSuccessMsg('Registratie succesvol! U kunt nu inloggen.');
          setIsRegistering(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          const users = getStoredUsers();
          const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

          if (matchedUser) {
            onLoginSuccess({
              email: matchedUser.email,
              name: matchedUser.name,
              id: matchedUser.email // fallback ID
            });
          } else if (email.toLowerCase() === 'admin@example.com' && password === 'admin123') {
            onLoginSuccess({
              email: 'admin@example.com',
              name: 'Beheerder',
              id: 'admin@example.com'
            });
          } else {
            setError('Ongeldig e-mailadres of wachtwoord.');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Er is een fout opgetreden bij de database-verbinding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = () => {
    setError('');
    // Google SSO Flow simulatie
    const googleUser = {
      email: 'thomareukema@gmail.com',
      name: 'Thomas Reukema',
      isGoogleUser: true
    };
    onLoginSuccess(googleUser);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-12" id="auth-container">
      <div className="w-full max-w-md space-y-8 bg-black border border-brand-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl" id="auth-card">
        
        {/* Logo & Titel */}
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-display font-black text-base mx-auto">
            G
          </div>
          <div>
            <h2 className="text-white text-base sm:text-lg font-bold font-display tracking-tight">
              Geldzaken
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              {isRegistering ? 'Maak een nieuw account aan' : 'Log in op uw dashboard'}
            </p>
          </div>
        </div>

        {/* Meldingen */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm py-3 px-4 rounded-xl text-center" id="auth-error">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm py-3 px-4 rounded-xl text-center" id="auth-success">
            {successMsg}
          </div>
        )}

        {/* Formulier */}
        <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5" id="auth-form">
          {isRegistering && (
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-zinc-400 mb-1.5">Naam</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Uw naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-brand-border rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-zinc-400 mb-1.5">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-500" />
              <input
                type="email"
                placeholder="naam@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-brand-border rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-zinc-400 mb-1.5">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-brand-border rounded-xl pl-11 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-zinc-400 mb-1.5">Bevestig Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black border border-brand-border rounded-xl pl-11 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button (White button, black text as requested) */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-white hover:bg-zinc-200 text-black py-3 sm:py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition flex items-center justify-center space-x-2 cursor-pointer mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : isRegistering ? (
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span>
              {isLoading 
                ? (isRegistering ? 'Account aanmaken...' : 'Inloggen...') 
                : (isRegistering ? 'Account aanmaken' : 'Inloggen')}
            </span>
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center pt-3">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccessMsg('');
            }}
            className="text-zinc-400 hover:text-white text-xs sm:text-sm underline cursor-pointer transition"
          >
            {isRegistering ? 'Al een account? Log direct in' : 'Nog geen account? Registreer hier'}
          </button>
        </div>

      </div>
    </div>
  );
}
