import React from "react";
import { getPromo } from "@/lib/services/promoWebService";
import { getTenant } from "@/lib/services/tenantService";
import PromoClientView from "./PromoClientView";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        tenantId: string;
        promoId: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tenantId, promoId } = await params;

    const [promo, tenant] = await Promise.all([
        getPromo(tenantId, promoId),
        getTenant(tenantId),
    ]);

    if (!promo) return {};

    const title = promo.nombre || "Promoción especial";
    const salonName = tenant?.nombre_salon || "Salon de Belleza";
    const description = promo.subtitulo_logo || `¡Participá de esta promoción en ${salonName} y obtené beneficios!`;
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

export default async function PromoPage({ params }: PageProps) {
    const { tenantId, promoId } = await params;

    const [promo, tenant] = await Promise.all([
        getPromo(tenantId, promoId),
        getTenant(tenantId),
    ]);

    if (!promo) {
        return notFound();
    }

    return (
        <PromoClientView
            tenantId={tenantId}
            promoId={promoId}
            initialPromo={promo}
            initialTenant={tenant}
        />
    );
}
