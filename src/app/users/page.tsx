import { redirect } from "next/navigation";
import { getUsersWithDetails } from "@/lib/utils/server/users";
import { getGroupIHs } from "@/lib/utils/server/ih";
import ManageUsers from "@/components/users/ManageUsers";
import { getSession } from "@/lib/auth/session";
import { canViewUsers, canManageUsers } from "@/lib/auth/rbac";

export default async function UsersPage() {
    const session = await getSession();

    if (!session) {
        redirect("/");
    }

    // Only LOGS and ADMIN can view users page
    if (!canViewUsers(session.user.role)) {
        redirect("/catalogue");
    }

    const [users, groupIHs] = await Promise.all([
        getUsersWithDetails(),
        getGroupIHs(),
    ]);

    // Pass whether user can manage (CRUD) users - only ADMIN
    const canManage = canManageUsers(session.user.role);

    return <ManageUsers users={users} groupIHs={groupIHs} userRole={session.user.role} canManage={canManage} />;
}
