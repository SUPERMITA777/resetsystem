"use client";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">RESET SYSTEM</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl text-center">
        Plataforma inteligente de gestión para salones y centros de estética.
      </p>

      <div className="flex gap-4">
        <button className="px-6 py-3 bg-[var(--primary)] text-[var(--background)] font-medium rounded-lg hover:opacity-90 transition-opacity">
          Iniciar Sesión
        </button>
        <button className="px-6 py-3 border border-[var(--primary)] text-[var(--primary)] font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
          Demo Dashboard
        </button>
      </div>

      <div className="mt-16 flex gap-4 items-center">
        <p className="text-sm text-gray-400">Temas:</p>
        <div className="flex gap-2">
          <button className="w-6 h-6 rounded-full bg-[#D4A373] border-2 border-transparent hover:border-gray-400" title="Nude" onClick={() => document.body.className = `theme-nude ${document.body.className.replace(/theme-[a-z]+/, '')}`} />
          <button className="w-6 h-6 rounded-full bg-[#B8B8FF] border-2 border-transparent hover:border-gray-400" title="Lavender" onClick={() => document.body.className = `theme-lavender ${document.body.className.replace(/theme-[a-z]+/, '')}`} />
          <button className="w-6 h-6 rounded-full bg-[#A3B18A] border-2 border-transparent hover:border-gray-400" title="Sage" onClick={() => document.body.className = `theme-sage ${document.body.className.replace(/theme-[a-z]+/, '')}`} />
        </div>
      </div>
    </div>
  );
}
