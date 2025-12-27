'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TelegramLoginButtonProps {
  botUsername: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  lang?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: any) => void;
    };
  }
}

export function TelegramLoginButton({
  botUsername,
  buttonSize = 'large',
  cornerRadius,
  requestAccess = true,
  usePic = true,
  lang = 'en',
}: TelegramLoginButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Define callback function for Telegram widget
    window.TelegramLoginWidget = {
      dataOnauth: async (user: any) => {
        setIsLoading(true);

        try {
          // Send auth data to our login API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
          });

          const data = await response.json();

          if (data.success) {
            toast.success(`Welcome, ${data.user.firstName}!`);
            router.push('/catalogue');
            router.refresh();
          } else {
            toast.error(data.error || 'Authentication failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          toast.error('An error occurred during login');
        } finally {
          setIsLoading(false);
        }
      },
    };

    // Create Telegram widget script
    if (containerRef.current && !containerRef.current.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', buttonSize);
      if (cornerRadius !== undefined) {
        script.setAttribute('data-radius', cornerRadius.toString());
      }
      script.setAttribute('data-request-access', requestAccess ? 'write' : 'read');
      script.setAttribute('data-userpic', usePic.toString());
      script.setAttribute('data-lang', lang);
      script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');

      containerRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      if (window.TelegramLoginWidget) {
        delete window.TelegramLoginWidget.dataOnauth;
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic, lang, router]);

  return (
    <div className="relative">
      <div ref={containerRef} className={isLoading ? 'opacity-50 pointer-events-none' : ''} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
        </div>
      )}
    </div>
  );
}
