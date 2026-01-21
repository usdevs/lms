'use client';

import { LoginButton } from '@telegram-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NavbarLoginButtonProps {
  botUsername: string;
}

export function NavbarLoginButton({ botUsername }: NavbarLoginButtonProps) {
  const router = useRouter();

  return (
    <LoginButton
      botUsername={botUsername}
      onAuthCallback={async (data) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (result.success) {
            toast.success(`Welcome, ${result.user.firstName}!`);
            router.push('/catalogue');
            router.refresh();
          } else {
            toast.error(result.error || 'Authentication failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          toast.error('An error occurred during login');
        }
      }}
    />
  );
}
