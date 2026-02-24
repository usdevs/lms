'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { DEV_ROLES } from '@/lib/auth/dev-auth';
import { USER_ROLE_LABELS } from '@/lib/types/user';

/** Ask the server to set the dev-role cookie (keeps all cookie logic in session.ts). */
async function setDevRole(role: UserRole) {
  const res = await fetch('/api/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to set dev role');
}

interface DevRoleDropdownProps {
  currentRole?: UserRole;
}

export function DevRoleDropdown({ currentRole }: DevRoleDropdownProps) {
  const router = useRouter();
  const value = currentRole ?? UserRole.ADMIN;

  // In dev with no session yet, set default role so getSession() returns a session
  useEffect(() => {
    if (currentRole === undefined) {
      setDevRole(UserRole.ADMIN).then(() => router.refresh());
    }
  }, [currentRole, router]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    await setDevRole(role);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Dev role:</span>
      <select
        value={value}
        onChange={handleChange}
        className="rounded border border-input bg-background px-2 py-1 text-sm"
      >
        {DEV_ROLES.map((role) => (
          <option key={role} value={role}>
            {USER_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </div>
  );
}
