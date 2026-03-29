import { Helmet } from "react-helmet-async";

const SITE_URL = "https://karakatizza.com";
const DEFAULT_TITLE = "Каракатица — доставка суші та ролів у Миколаєві";
const DEFAULT_DESCRIPTION =
  "Преміальна доставка суші, ролів і сетів у Миколаєві. Свіжі інгредієнти, швидка доставка, самовивіз та вигідні акції.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = "website",
  noindex = false,
  keywords = "",
  jsonLd = null,
}) {
  return (
    <Helmet>
      <html lang="uk" />
      <title>{title}</title>
      <meta name="description" content={description} />

      {keywords ? <meta name="keywords" content={keywords} /> : null}

      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={url} />

      <meta property="og:locale" content="uk_UA" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Каракатица" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <meta name="theme-color" content="#ff5a1f" />

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}