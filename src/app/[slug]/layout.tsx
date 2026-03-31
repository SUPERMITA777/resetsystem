import type { Metadata, ResolvingMetadata } from "next";
import { getTenant } from "@/lib/services/tenantService";

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  
  try {
    const tenant = await getTenant(slug);

    if (!tenant) {
      return {
        title: "Salón no encontrado | RESETSYSTEM",
      };
    }

    const config = tenant.web_config;
    const title = config?.seo_title || tenant.nombre_salon || "RESET HOME SPA";
    const description = config?.seo_description || tenant.datos_contacto?.descripcion || "Reserva tu turno online";
    
    const shareTitle = config?.social_share_title || title;
    const shareDescription = config?.social_share_description || description;
    const shareImage = config?.hero_image_url || tenant.logo_url || "";

    return {
      title: title,
      description: description,
      openGraph: {
        title: shareTitle,
        description: shareDescription,
        images: shareImage ? [shareImage] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: shareTitle,
        description: shareDescription,
        images: shareImage ? [shareImage] : [],
      },
    };
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    return {
      title: "Cargando... | RESETSYSTEM",
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
