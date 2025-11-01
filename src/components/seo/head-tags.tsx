import Head from 'next/head';

interface HeadTagsProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

export function HeadTags({ 
  title = "Laaiqa - Connect with Professional Artists",
  description = "Discover and connect with talented artists for your creative projects.",
  canonical,
  noIndex = false 
}: HeadTagsProps) {
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/Laaiqa Coloured Favicon.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/Laaiqa White Favicon.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/Laaiqa Coloured Favicon.png" />
      <link rel="mask-icon" href="/Laaiqa White Favicon.png" color="#C40F5A" />
      
      {/* Theme and App */}
      <meta name="theme-color" content="#C40F5A" />
      <meta name="msapplication-TileColor" content="#C40F5A" />
      <meta name="application-name" content="Laaiqa" />
      <meta name="apple-mobile-web-app-title" content="Laaiqa" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* PWA */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Additional SEO */}
      <meta name="author" content="Laaiqa Team" />
      <meta name="creator" content="Laaiqa" />
      <meta name="publisher" content="Laaiqa" />
      <meta name="format-detection" content="telephone=no,address=no,email=no" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical || "https://laaiqa.com/"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/Laaiqa Coloured Favicon.png" />
      <meta property="og:site_name" content="Laaiqa" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical || "https://laaiqa.com/"} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content="/Laaiqa Coloured Favicon.png" />
      <meta property="twitter:creator" content="@laaiqa" />
      
      {/* Additional Meta Tags */}
      <meta name="keywords" content="artists,creative services,custom art,professional artists,art booking,creative projects,art marketplace,artistic services" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="web" />
      <meta name="rating" content="general" />
    </Head>
  );
}