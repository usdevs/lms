import Catalogue from "@/components/catalogue/Catalogue";
import { getIHs } from "@/lib/utils/server/ih";
import { getSlocs } from "@/lib/utils/server/slocs";
import { getSession } from "@/lib/auth/session";

export default async function CataloguePage() {
  const [session, slocs, ihs] = await Promise.all([
    getSession(),
    getSlocs(),
    getIHs(),
  ]);

  return <Catalogue slocs={slocs} ihs={ihs} userRole={session?.user.role} />;
}

