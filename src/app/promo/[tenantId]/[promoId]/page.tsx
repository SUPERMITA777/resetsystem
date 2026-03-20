import React from "react";
import { getPromo } from "@/lib/services/promoWebService";
import { getTenant } from "@/lib/services/tenantService";
import PromoClientView from "./PromoClientView";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        tenantId: string;
        promoId: string;
    }>;
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
