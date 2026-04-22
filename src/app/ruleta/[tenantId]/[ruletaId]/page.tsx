import React from "react";
import { getPromo } from "@/lib/services/promoWebService";
import { getTenant } from "@/lib/services/tenantService";
import RuletaClientView from "./RuletaClientView";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        tenantId: string;
        ruletaId: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tenantId, ruletaId } = await params;

    const [promo, tenant] = await Promise.all([
        getPromo(tenantId, ruletaId),
        getTenant(tenantId),
    ]);

    if (!promo) return {};

    const title = promo.nombre || "Girá la Ruleta";
    const salonName = tenant?.nombre_salon || "Salon de Belleza";
    const description = promo.subtitulo_logo || `¡Girá la ruleta en ${salonName} y ganá premios exclusivos!`;
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

export default async function RuletaPage({ params }: PageProps) {
    const { tenantId, ruletaId } = await params;

    const [promo, tenant] = await Promise.all([
        getPromo(tenantId, ruletaId),
        getTenant(tenantId),
    ]);

    if (!promo) {
        return notFound();
    }

    return (
        <RuletaClientView
            tenantId={tenantId}
            ruletaId={ruletaId}
            initialPromo={promo}
            initialTenant={tenant}
        />
    );
}
