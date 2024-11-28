'use client';

import Image from 'next/image';
import { Nunito } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { login, register, type LoginActionState, type RegisterActionState } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Backgr from "@/public/Background.png"

const nunito = Nunito({ subsets: ['latin'] });

export default function AuthPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginState, loginAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: 'idle' }
  );

  const [registerState, registerAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: 'idle' }
  );

  const state = authMode === 'login' ? loginState : registerState;

  useEffect(() => {
    if (state.status === 'failed') {
      setIsLoading(false);
      toast.error(authMode === 'login' ? 'Invalid credentials!' : 'Failed to create account');
    } else if (state.status === 'invalid_data') {
      setIsLoading(false);
      toast.error('Failed validating your submission!');
    } else if (state.status === 'user_exists') {
      setIsLoading(false);
      toast.error('Account already exists');
    } else if (state.status === 'success') {
      if (authMode === 'register') {
        toast.success('Account created successfully');
      }
      setIsSuccessful(true);
      setIsLoading(false);
      router.push('/'); // Direct redirection after successful auth
      setShowAuthModal(false);
    }
  }, [state, router, authMode]);

  const handleSubmit = async (formData: FormData) => {
    setEmail(formData.get('email') as string);
    setIsLoading(true);
    startTransition(() => {
      if (authMode === 'login') {
        loginAction(formData);
      } else {
        registerAction(formData);
      }
    });
  };

  const handleGuestSignup = async () => {
    try {
      setIsLoading(true);
      const guestEmail = `guest_${Date.now()}@linguamate.com`;
      const guestPassword = `guest_${Date.now()}`;
      
      const formData = new FormData();
      formData.append('email', guestEmail);
      formData.append('password', guestPassword);
      
      startTransition(() => {
        registerAction(formData);
      });
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to sign up as guest');
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-white">
      <div className="fixed inset-0 z-0">
        <Image
          src={Backgr}
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          quality={100}
          priority
        />
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8">
        <h1 className={`${nunito.className} text-4xl sm:text-5xl text-black md:text-6xl font-bold mb-4`}>
          LinguaMate
        </h1>
        <p className="text-lg sm:text- text-[#718096] md:text-2xl mb-8 max-w-2xl">
          The AI language assistant that helps you keep up with conversations!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button 
            className='rounded-3xl border border-b-4 border-[#444545] text-black hover:bg-[#FBE055] bg-[#FBE055]'
            variant="default" 
            size="lg"
            onClick={() => {
              setAuthMode('register');
              setShowAuthModal(true);
            }}
            disabled={isLoading}
          >
            Sign Up
          </Button>
          <Button
            className='rounded-3xl border border-b-4 border-[#444545] text-black bg-white'
            variant="secondary" 
            size="lg"
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            disabled={isLoading}
          >
            Log In
          </Button>
        </div>
        <Button 
          className='text-black underline hover:bg-transparent bg-transparent'
          size="lg"
          onClick={handleGuestSignup}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Continue as Guest'}
        </Button>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {authMode === 'login' 
                  ? 'Use your email and password to sign in'
                  : 'Create an account with your email and password'
                }
              </p>
            </div>
            <AuthForm action={handleSubmit} defaultEmail={email}>
              <SubmitButton isSuccessful={isSuccessful} >
                {authMode === 'login' ? 'Sign in' : 'Sign up'}
              </SubmitButton>
              <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                  disabled={isLoading}
                >
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
                {authMode === 'login' ? ' for free.' : ' instead.'}
              </p>
            </AuthForm>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}