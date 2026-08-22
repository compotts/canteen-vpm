export type MenuItem = {
  id: number;
  name: string;
  price: number;
  weight?: string;
  initialQuantity: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export type Menu = {
  date: string;
  sections: MenuSection[];
};

export type OrderLink = {
  label: string;
  date: string;
};

export type DishTranslation = {
  ru: string;
  en: string;
  photo: string | null;
};

export type DishTranslationMap = Record<string, DishTranslation>;
