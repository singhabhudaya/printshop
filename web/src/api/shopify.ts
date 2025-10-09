// /web/src/api/shopify.ts

const DOMAIN = (import.meta as any).env.VITE_SHOPIFY_STORE_URL?.replace(/https?:\/\//, "");
const TOKEN = (import.meta as any).env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const GRAPHQL_URL = DOMAIN ? `https://${DOMAIN}/api/2024-07/graphql.json` : "";

/** Minimal GraphQL client (throws on Shopify errors) */
async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? res.statusText));
  }
  return json.data as T;
}

/** Existing helper: collection + products */
export async function getCollectionWithProducts(handle: string, first = 4) {
  const q = `
    query CollectionWithProducts($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        image { url altText }
        products(first: $first) {
          edges {
            node {
              id
              handle
              title
              featuredImage { url altText }
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
            }
          }
        }
      }
    }
  `;
  const data = await gql<{ collectionByHandle: any }>(q, { handle, first });
  return data.collectionByHandle;
}

/* ===================== Smart Search helpers ===================== */

type Img = { url: string; altText?: string | null };

export type ShopifyProductLite = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  tags?: string[] | null;
  featuredImage?: Img | null;
};

export type ShopifyCollectionLite = {
  id: string;
  handle: string;
  title: string;
  image?: Img | null;
};

const canShopify = Boolean(GRAPHQL_URL && TOKEN);

/** Search products by text */
export async function searchProducts(term: string, first = 10): Promise<ShopifyProductLite[]> {
  if (!canShopify || !term?.trim()) return [];
  const q = `
    query SearchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query, sortKey: RELEVANCE) {
        edges { node { id handle title vendor tags featuredImage { url altText } } }
      }
    }
  `;
  try {
    const data = await gql<{ products: { edges: { node: ShopifyProductLite }[] } }>(q, { query: term, first });
    return (data.products?.edges ?? []).map(e => e.node);
  } catch {
    return [];
  }
}

/** Search collections by text */
export async function searchCollections(term: string, first = 6): Promise<ShopifyCollectionLite[]> {
  if (!canShopify || !term?.trim()) return [];
  const q = `
    query SearchCollections($query: String!, $first: Int!) {
      collections(first: $first, query: $query) {
        edges { node { id handle title image { url altText } } }
      }
    }
  `;
  try {
    const data = await gql<{ collections: { edges: { node: ShopifyCollectionLite }[] } }>(q, { query: term, first });
    return (data.collections?.edges ?? []).map(e => e.node);
  } catch {
    return [];
  }
}

/** Titles corpus for "Did you mean" suggestion (tries 'all' then falls back to TITLE) */
export async function fetchSuggestionTitles(first = 120): Promise<string[]> {
  if (!canShopify) return [];
  try {
    const qAll = `
      query AllTitles($first: Int!) {
        collectionByHandle(handle: "all") {
          products(first: $first) { edges { node { title } } }
        }
      }
    `;
    const a = await gql<{ collectionByHandle: { products: { edges: { node: { title: string } }[] } } }>(qAll, { first });
    const edges = a.collectionByHandle?.products?.edges ?? [];
    if (edges.length) return edges.map(e => e.node.title).filter(Boolean);
  } catch {
    /* fall through to fallback */
  }
  const qTitle = `
    query Titles($first: Int!) {
      products(first: $first, sortKey: TITLE) { edges { node { title } } }
    }
  `;
  try {
    const b = await gql<{ products: { edges: { node: { title: string } }[] } }>(qTitle, { first });
    return (b.products?.edges ?? []).map(e => e.node.title).filter(Boolean);
  } catch {
    return [];
  }
}

/** Featured products for empty-state suggestions (tries 'all' then BEST_SELLING fallback) */
export async function fetchFeaturedProducts(first = 16): Promise<ShopifyProductLite[]> {
  if (!canShopify) return [];
  // Try "all" collection first
  const qAll = `
    query FeaturedFromAll($first: Int!) {
      collectionByHandle(handle: "all") {
        products(first: $first, sortKey: BEST_SELLING) {
          edges { node { id handle title vendor tags featuredImage { url altText } } }
        }
      }
    }
  `;
  try {
    const data = await gql<{ collectionByHandle: { products: { edges: { node: ShopifyProductLite }[] } } }>(qAll, { first });
    const edges = data.collectionByHandle?.products?.edges ?? [];
    if (edges.length) return edges.map(e => e.node);
  } catch {
    /* fall through to fallback */
  }

  // Fallback: global products, best selling
  const qBest = `
    query FallbackBestSelling($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { id handle title vendor tags featuredImage { url altText } } }
      }
    }
  `;
  try {
    const data = await gql<{ products: { edges: { node: ShopifyProductLite }[] } }>(qBest, { first });
    return (data.products?.edges ?? []).map(e => e.node);
  } catch {
    return [];
  }
}
