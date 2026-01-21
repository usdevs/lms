import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export async function Navbar() {
  const session = await getSession();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Package className="h-6 w-6" />
          <span className="font-bold text-xl">NUSC LMS</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-6 flex-1">
          {session && (
            <>
              <Link
                href="/catalogue"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Catalogue
              </Link>
              {/* Add more navigation links as needed */}
            </>
          )}
        </div>

        {/* User Menu or Login Button */}
        <div className="flex items-center gap-4">
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <Button asChild>
              <Link href="/login">Login with Telegram</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
