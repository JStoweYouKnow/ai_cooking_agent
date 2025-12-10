export interface GroceryStore {
  id: string;
  name: string;
  description: string;
  url: string;
  accentColor: string;
}

export const groceryStores: GroceryStore[] = [
  {
    id: "instacart",
    name: "Instacart",
    description: "Same-day delivery from local stores",
    url: "https://www.instacart.com",
    accentColor: "#33C481",
  },
  {
    id: "wholefoods",
    name: "Whole Foods",
    description: "Organic-first groceries delivered",
    url: "https://www.wholefoodsmarket.com",
    accentColor: "#0F6F4F",
  },
  {
    id: "amazonfresh",
    name: "Amazon Fresh",
    description: "Amazon’s grocery service with fast delivery",
    url: "https://www.amazon.com/alm/storefront",
    accentColor: "#00A8E1",
  },
  {
    id: "target",
    name: "Target",
    description: "Order pickup, drive-up, or delivery",
    url: "https://www.target.com/c/grocery/-/N-5xt1a",
    accentColor: "#E51C2B",
  },
  {
    id: "walmart",
    name: "Walmart",
    description: "Everyday essentials with curbside pickup",
    url: "https://grocery.walmart.com",
    accentColor: "#0071CE",
  },
  {
    id: "kroger",
    name: "Kroger",
    description: "Regional favorite with delivery & pickup",
    url: "https://www.kroger.com",
    accentColor: "#004E9A",
  },
];

export function getStoreDeepLink(storeId: string) {
  const store = groceryStores.find((s) => s.id === storeId);
  return store?.url ?? "https://www.google.com/search?q=grocery delivery";
}



