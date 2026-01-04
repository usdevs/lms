import Catalogue from "@/components/catalogue/Catalogue";
import { getItems, getSlocs, getIHs } from "@/lib/utils/server/item";

export default async function CataloguePage() {
  const [slocs, ihs] = await Promise.all([
    getSlocs(),
    getIHs(),
  ]);

  return <Catalogue slocs={slocs} ihs={ihs} />;
}

