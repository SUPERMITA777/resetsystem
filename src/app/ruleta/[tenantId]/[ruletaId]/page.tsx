import React from "react";
import { getPromo } from "@/lib/services/promoWebService";
import { getTenant } from "@/lib/services/tenantService";
import RuletaClientView from "./RuletaClientView";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        tenantId: string;
        ruletaId: string;
    }>;
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
