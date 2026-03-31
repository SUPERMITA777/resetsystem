import type { Metadata } from "next";

// NO server-side Firestore calls - they crash on Vercel serverless.
// Dynamic titles are handled client-side by page.tsx via document.title.

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  
  return {
    title: `${slug} | RESETSYSTEM`,
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
