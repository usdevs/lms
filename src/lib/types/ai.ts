export type CatalogueSearchableFields = {
  itemDesc: string;
  itemRemarks?: string | null;
  itemSloc: string;
  itemIh: string;
  itemImageCaption?: string | null;
};

export type CatalogueImageContext = {
  itemDesc?: string | null;
  itemRemarks?: string | null;
  itemUom?: string | null;
  itemSloc?: string | null;
};
