import type { Metadata } from "next";

// IMPORTANTE: NO usar Firestore aquí. El SDK cliente de Firebase
// NO funciona en entornos serverless (Vercel). Las llamadas a getDoc()
// se quedan colgadas indefinidamente, causando pantalla en blanco.
// Los títulos dinámicos se manejan client-side en page.tsx via document.title.

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  
  // Título estático basado en el slug - sin llamadas a BD
  const formattedName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `${formattedName} | RESETSYSTEM`,
    description: "Reserva tu turno online",
  };
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
