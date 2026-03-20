import type { Metadata } from 'next';
import { getTenant } from "@/lib/services/tenantService";

type Props = {
  params: Promise<{ tenantId: string; promoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await getTenant(tenantId);

  const title = "RESET HOME SPA WEB";
  const description = "¡TU MEJOR VERSIÓN!";
  const logo = tenant?.logo_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: logo ? [logo] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: logo ? [logo] : [],
    },
    icons: {
      icon: logo || "/favicon.ico",
      shortcut: logo || "/favicon.ico",
      apple: logo || "/favicon.ico",
    }
  };
}

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
