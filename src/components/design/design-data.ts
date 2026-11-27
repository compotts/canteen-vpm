export type DesignAllergen = "gluten" | "eggs" | "milk" | "nuts";
export type DesignCategory = "all" | "main" | "sides" | "salads" | "soups";

export type DesignDish = {
  id: string;
  sourceId: number;
  sourceName: string;
  category: Exclude<DesignCategory, "all">;
  photo: string;
  grams: number | null;
  name?: string;
  weightLabel?: string;
  cents: number;
  allergens: DesignAllergen[] | null;
};

export const DESIGN_CATEGORIES: DesignCategory[] = [
  "all",
  "main",
  "sides",
  "salads",
  "soups",
];
export const DESIGN_ALLERGENS: DesignAllergen[] = [
  "gluten",
  "eggs",
  "milk",
  "nuts",
];
