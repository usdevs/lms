'use client';

import { LoginButton } from '@telegram-auth/react';

interface LoginModalProps {
  botUsername: string;
}

export function LoginModal({ botUsername }: LoginModalProps) {
  return (
    <LoginButton
      botUsername={botUsername}
      authCallbackUrl="/api/auth/callback"
    />
  );
}
