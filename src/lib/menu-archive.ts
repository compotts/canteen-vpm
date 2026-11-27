export type ArchivedMenuItem = {
  id: number;
  name: string;
  price: number;
  weight: string;
};

export type ArchivedMenuSection = {
  title: string;
  items: ArchivedMenuItem[];
};

export type ArchivedMenu = {
  date: string;
  sections: ArchivedMenuSection[];
  capturedAt: string;
  updatedAt: string;
};
