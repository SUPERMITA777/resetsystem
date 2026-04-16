import { getShortLink } from "@/lib/services/promoWebService";
import { redirect, notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        shortCode: string;
    }>;
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
