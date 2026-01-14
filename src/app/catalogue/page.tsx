import Catalogue from "@/components/catalogue/Catalogue";
import { getIHs } from "@/lib/utils/server/ih";
import { getSlocs } from "@/lib/utils/server/slocs";


export default async function CataloguePage() {
  const [slocs, ihs] = await Promise.all([
    getSlocs(),
    getIHs(),
  ]);

  return <Catalogue slocs={slocs} ihs={ihs} />;
}

