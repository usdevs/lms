import Catalogue from "@/components/catalogue/Catalogue";
import { getItems, getSlocs, getIHs } from "@/lib/utils/server/item";

export default async function CataloguePage() {
  const [items, slocs, ihs] = await Promise.all([
    getItems(),
    getSlocs(),
    getIHs(),
  ]);

  return <Catalogue items={items} slocs={slocs} ihs={ihs} />;
}

