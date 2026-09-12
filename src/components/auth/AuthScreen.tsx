import React, { useState } from 'react';
import { Shield, Mail, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineNotice } from '../ui/InlineNotice';
import {
  signInWithEmailAndPin,
  signInWithGoogle,
  AuthGateResult,
} from '../../services/authService';

interface AuthScreenProps {
  onAuthenticated: (result: AuthGateResult) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [denialType, setDenialType] = useState<string | null>(null);

  const handleEmailPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      setErrorMessage('Please enter both your work email and access PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setDenialType(null);

    try {
      const result = await signInWithEmailAndPin(email, pin);
      if (result.isAuthorized && result.userProfile) {
        onAuthenticated(result);
      } else {
        if (result.denialReason === 'NOT_FOUND') {
          setErrorMessage('No authorized account found matching this email address.');
        } else if (result.denialReason === 'SUSPENDED' || result.denialReason === 'DISABLED') {
          setDenialType(result.denialReason);
          setErrorMessage(`Access Denied: Your HunarOS account is currently ${result.denialReason.toLowerCase()}.`);
        } else {
          setErrorMessage('Invalid credentials or unauthorized PIN.');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDenialType(null);

    try {
      const result = await signInWithGoogle();
      if (result.isAuthorized && result.userProfile) {
        onAuthenticated(result);
      } else {
        setDenialType(result.denialReason || 'UNAUTHORIZED');
        if (result.denialReason === 'SUSPENDED' || result.denialReason === 'DISABLED') {
          setErrorMessage(`Access Denied: Your HunarOS account is ${result.denialReason.toLowerCase()}.`);
        } else {
          setErrorMessage(
            'Authorization Failed: Your Google account is authenticated, but is not authorized in HunarOS. An administrator must provision your staff profile first.'
          );
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-900 text-white mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 text-balance">HunarOS</h1>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-medium">
          Enterprise Operating System for Training & Skills Organizations
        </p>

        <div className="my-6 border-t border-neutral-100" />

        {/* Security Policy Notice */}
        <div className="mb-6 text-left">
          <InlineNotice variant="info">
            <strong>Internal Access Only:</strong> Access is restricted to authorized personnel. Authorized users sign in via their verified corporate Google account or assigned work email with security PIN.
          </InlineNotice>
        </div>

        {errorMessage && (
          <div className="mb-6 text-left">
            <InlineNotice variant="error" title={denialType ? `Policy Violation (${denialType})` : 'Authentication Error'}>
              {errorMessage}
            </InlineNotice>
          </div>
        )}

        {/* Authorized Google OAuth - Primary */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full justify-center"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          isLoading={isLoading}
          style={{ height: '68.4445px', width: '250px', fontSize: '13px', lineHeight: '1px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'system-ui' }}
          icon={
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          }
        >
          Sign In with Google Account
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500 font-medium tracking-wider">
              Or staff access via PIN
            </span>
          </div>
        </div>

        {/* Email + PIN Form */}
        <form onSubmit={handleEmailPinSubmit} className="space-y-4 text-left">
          <Input
            label="Work Email"
            type="email"
            required
            autoComplete="email" spellCheck={false}
            placeholder="staff@institute.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Access PIN"
            type="password"
            required
            maxLength={8}
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            hint="Enter your assigned numeric or alphanumeric security PIN"
          />

          <Button
            type="submit"
            variant="secondary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
            icon={<LogIn className="w-4 h-4" />}
          >
            Sign In with PIN
          </Button>
        </form>
      </div>
    </div>
  );
};
