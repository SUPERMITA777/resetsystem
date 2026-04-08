import { dbGet, dbList, dbUpdate, dbAdd, dbSet } from "./apiBridge";

export type UserRole = 'superadmin' | 'salon_admin' | 'staff';

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: UserRole;
    tenantId: string | null;
    status: 'active' | 'inactive';
    whatsapp?: string;
    p_shadow?: string;
    createdAt: any;
}

const COLLECTION_NAME = "users";

export async function createUserProfile(uid: string, profile: Partial<UserProfile>) {
    await dbSet(COLLECTION_NAME, uid, {
        ...profile,
        uid,
        status: profile.status || 'active',
        createdAt: new Date().toISOString(),
    });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    await dbUpdate(COLLECTION_NAME, uid, data);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    return await dbGet(COLLECTION_NAME, uid);
}

export async function getUsersByTenant(tenantId: string): Promise<UserProfile[]> {
    return await dbList(COLLECTION_NAME, [
        { field: "tenantId", operator: "==", value: tenantId }
    ]);
}

export async function getAllUsers(): Promise<UserProfile[]> {
    // Nota: El proxy actualmente soporta filtros básicos. 
    // Si necesitamos ordenamiento complejo lo manejamos en el cliente tras recibir la lista.
    const list = await dbList(COLLECTION_NAME);
    return list.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1));
}
