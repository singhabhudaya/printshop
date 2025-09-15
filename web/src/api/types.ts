export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  images?: any;    // Json in DB
  // ...anything else you already have
}
