import { redirect } from 'next/navigation';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { getSession } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome to NUSC LMS</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Telegram account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <TelegramLoginButton
            botUsername={botUsername}
            buttonSize="large"
            cornerRadius={10}
            requestAccess={true}
            usePic={true}
          />
          <p className="text-xs text-muted-foreground text-center">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
