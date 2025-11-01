import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'service';
}

export function StructuredData({ type = 'website' }: StructuredDataProps) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Laaiqa",
    "description": "Professional artist platform connecting creative talent with clients",
    "url": "https://laaiqa.com",
    "logo": "https://laaiqa.com/Laaiqa Coloured Favicon.png",
    "sameAs": [
      "https://twitter.com/laaiqa",
      "https://instagram.com/laaiqa",
      "https://facebook.com/laaiqa"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    }
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Laaiqa",
    "description": "Connect with professional artists for your creative projects",
    "url": "https://laaiqa.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://laaiqa.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Creative Artist Services",
    "description": "Professional artistic services including custom art, design, and creative projects",
    "provider": {
      "@type": "Organization",
      "name": "Laaiqa"
    },
    "serviceType": "Creative Services",
    "areaServed": "Worldwide"
  };

  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return organizationData;
      case 'service':
        return serviceData;
      default:
        return websiteData;
    }
  };

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  );
}