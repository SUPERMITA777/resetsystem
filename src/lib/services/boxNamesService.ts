import { dbGet, dbSet, dbUpdate } from "./apiBridge";

/**
 * Box names per date are stored in:
 * tenants/{tenantId}/box_names/{date}
 * 
 * Document structure:
 * {
 *   "box-1": "DEPILACION",
 *   "box-2": "FACIAL",
 *   ...
 * }
 */

export async function getBoxNames(tenantId: string, date: string): Promise<Record<string, string>> {
    try {
        const data = await dbGet(`tenants/${tenantId}/box_names`, date);
        if (data) {
            return data as Record<string, string>;
        }
        return {};
    } catch (error) {
        console.error("Error loading box names:", error);
        return {};
    }
}

export async function setBoxName(tenantId: string, date: string, boxId: string, name: string): Promise<void> {
    const existing = await dbGet(`tenants/${tenantId}/box_names`, date);

    if (existing) {
        await dbUpdate(`tenants/${tenantId}/box_names`, date, { [boxId]: name });
    } else {
        await dbSet(`tenants/${tenantId}/box_names`, date, { [boxId]: name });
    }
}
