import type { Metadata } from "next";

// NO server-side Firestore calls - they crash on Vercel serverless.
// Dynamic titles are handled client-side by page.tsx via document.title.

import { getTenant } from "@/lib/services/tenantService";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  
  try {
    const tenant = await getTenant(slug);

    if (!tenant) {
      return { title: "Salón no encontrado | RESETSYSTEM" };
    }

    const config = tenant.web_config;
    const title = config?.seo_title || tenant.nombre_salon || "RESET HOME SPA";
    const description = config?.seo_description || tenant.datos_contacto?.descripcion || "Reserva tu turno online";
    
    return {
      title: title,
      description: description,
      openGraph: {
        title: config?.social_share_title || title,
        description: config?.social_share_description || description,
        images: config?.hero_image_url || tenant.logo_url || "",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: config?.social_share_title || title,
        description: config?.social_share_description || description,
        images: config?.hero_image_url || tenant.logo_url || "",
      },
    };
  } catch (error) {
    return {
      title: `${slug} | RESETSYSTEM`,
      description: "Reserva tu turno online",
    };
  }
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
