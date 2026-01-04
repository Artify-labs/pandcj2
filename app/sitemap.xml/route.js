import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.DB_NAME || 'pandc';
const DOMAIN = 'https://pandcjewellery.com';

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Helper to generate SEO-friendly slug
function generateProductSlug(name, id) {
  const slugName = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  return `${slugName}-${id}`;
}

// Helper to format date for XML (YYYY-MM-DD)
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

async function fetchProducts() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const products = await db.collection('products').find({}).toArray();
    return products;
  } finally {
    await client.close();
  }
}

function generateSitemapXml(products) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Homepage -->
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Shop Page -->
  <url>
    <loc>${DOMAIN}/shop</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Pricing Page -->
  <url>
    <loc>${DOMAIN}/pricing</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Orders Page -->
  <url>
    <loc>${DOMAIN}/orders</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

`;

  // Add all products
  if (products && products.length > 0) {
    products.forEach((product) => {
      const slug = generateProductSlug(product.name, product.id);
      const productUrl = `${DOMAIN}/product/${slug}`;
      const lastMod = product.updatedAt ? formatDate(product.updatedAt) : formatDate(product.createdAt || new Date());
      
      xml += `  <!-- Product: ${escapeXml(product.name)} -->
  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

`;
    });
  }

  xml += `</urlset>`;
  return xml;
}

export async function GET(request) {
  try {
    const products = await fetchProducts();
    const sitemapXml = generateSitemapXml(products);

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
