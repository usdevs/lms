import Link from 'next/link';
import { Package } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoginModal } from '@/components/auth/LoginModal';
import { DevRoleDropdown } from '@/components/auth/DevRoleDropdown';

export async function Navbar() {
  const session = await getSession();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-2 font-bold text-orange-500 hover:text-orange-600 transition-colors">
          <Package className="h-5 w-5" />
          NUSC LMS
        </Link>

        {/* Dev role dropdown (local only) | User Menu or Login */}
        <div className="flex items-center gap-4">
          {isDev ? (
            <DevRoleDropdown currentRole={session?.user?.role} />
          ) : session ? (
            <UserMenu user={session.user} />
          ) : (
            botUsername && <LoginModal botUsername={botUsername} />
          )}
        </div>
      </div>
    </nav>
  );
}
