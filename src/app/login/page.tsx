import { redirect } from 'next/navigation';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { getSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

// Telegram icon component
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export const metadata = {
  title: 'Login | NUSC LMS',
  description: 'Login to NUSC Logistics Management System',
};

export default async function LoginPage() {
  // Redirect to catalogue if already logged in
  const session = await getSession();
  if (session) {
    redirect('/catalogue');
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  if (!botUsername) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-destructive">Configuration Error</CardTitle>
            <CardDescription>
              Telegram bot is not configured. Please set TELEGRAM_BOT_USERNAME in your environment
              variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardHeader className="space-y-4 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Welcome to NUSC LMS</CardTitle>
            <CardDescription className="text-base">
              Logistics Management System for NUS College
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-4">
          {/* Telegram Login Section */}
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3 justify-center text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <TelegramIcon className="h-4 w-4 text-[#0088cc]" />
                <span>Sign in with Telegram</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <div className="flex justify-center">
              <TelegramLoginButton
                botUsername={botUsername}
                buttonSize="large"
                cornerRadius={10}
                requestAccess={true}
                usePic={true}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[280px]">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
