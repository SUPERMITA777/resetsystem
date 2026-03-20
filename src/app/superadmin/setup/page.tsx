import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function SetupPage() {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 sm:p-8">
            <Toaster />
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="mx-auto bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-[#9381FF]" />
                </div>
                <h1 className="text-2xl font-bold font-montserrat text-gray-900">Bienvenido a RESET HOME SPA WEB</h1>
                <p className="text-gray-500 mt-2">Vamos a dejar tu sistema listo para recibir clientes en menos de 2 minutos.</p>
            </div>

            <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <OnboardingWizard />
            </div>
        </div>
    );
}
