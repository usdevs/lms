import { getUsersWithDetails } from "@/lib/utils/server/users";
import { getGroupIHs } from "@/lib/utils/server/ih";
import ManageUsers from "@/components/users/ManageUsers";

export default async function UsersPage() {
    const [users, groupIHs] = await Promise.all([
        getUsersWithDetails(),
        getGroupIHs(),
    ]);

    return <ManageUsers users={users} groupIHs={groupIHs} />;
}
