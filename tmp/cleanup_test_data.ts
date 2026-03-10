import { db } from "./src/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

async function cleanup() {
    const tenantId = "resetspa"; 
    console.log(`Cleaning up test data for tenant: ${tenantId}`);

    // 1. Cleanup Treatments
    const tratRef = collection(db, "tenants", tenantId, "tratamientos");
    const tratSnap = await getDocs(tratRef);
    for (const d of tratSnap.docs) {
        const data = d.data();
        const name = (data.nombre || "").toLowerCase();
        if (name.includes("test") || name.includes("prueba") || name.includes("demo") || name.includes("ejemplo")) {
            console.log(`Deleting test treatment: ${data.nombre}`);
            await deleteDoc(d.ref);
        }
    }

    // 2. Cleanup Turnos
    const agendaRef = collection(db, "tenants", tenantId, "agenda");
    const agendaSnap = await getDocs(agendaRef);
    for (const d of agendaSnap.docs) {
        const data = d.data();
        const client = (data.clienteAbreviado || "").toLowerCase();
        const trat = (data.tratamientoAbreviado || "").toLowerCase();
        if (client.includes("test") || client.includes("prueba") || trat.includes("test") || trat.includes("prueba")) {
            console.log(`Deleting test turno: ${data.clienteAbreviado} - ${data.tratamientoAbreviado}`);
            await deleteDoc(d.ref);
        }
    }

    console.log("Cleanup complete!");
}

cleanup().catch(console.error);
