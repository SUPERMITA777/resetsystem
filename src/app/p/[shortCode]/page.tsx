import { getShortLink, getPromo } from "@/lib/services/promoWebService";
import { getTenant } from "@/lib/services/tenantService";
import { redirect, notFound } from "next/navigation";
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        shortCode: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { shortCode } = await params;
    const linkData = await getShortLink(shortCode);
    
    if (!linkData) return {};

    const [promo, tenant] = await Promise.all([
        getPromo(linkData.tenantId, linkData.promoId),
        getTenant(linkData.tenantId),
    ]);

    const title = promo?.nombre || "Promoción especial";
    const salonName = tenant?.nombre_salon || "Salon de Belleza";
    const description = promo?.subtitulo_logo || `¡Participá y ganá premios increíbles en ${salonName}!`;
    const image = tenant?.logo_url;

    return {
        title: `${title} | ${salonName}`,
        description,
        openGraph: {
            title: `${title} | ${salonName}`,
            description,
            images: image ? [image] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | ${salonName}`,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function ShortLinkRedirect({ params }: PageProps) {
    const { shortCode } = await params;
    const linkData = await getShortLink(shortCode);
    
    if (!linkData) {
        return notFound();
    }
    
    if (linkData.tipo === "ruleta") {
        redirect(`/ruleta/${linkData.tenantId}/${linkData.promoId}`);
    }
    redirect(`/promo/${linkData.tenantId}/${linkData.promoId}`);
}
