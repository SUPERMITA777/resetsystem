import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";

export type UserRole = 'superadmin' | 'salon_admin' | 'staff';

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: UserRole;
    tenantId: string | null;
    status: 'active' | 'inactive';
    createdAt: any;
}

const COLLECTION_NAME = "users";

export async function createUserProfile(uid: string, profile: Partial<UserProfile>) {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(userRef, {
        ...profile,
        uid,
        status: profile.status || 'active',
        createdAt: serverTimestamp(),
    }, { merge: true });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(userRef, data);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }

    return null;
}

export async function getUsersByTenant(tenantId: string): Promise<UserProfile[]> {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(
        usersRef,
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as UserProfile);
}
