import { db, storage } from "../firebase";
import { collection, doc, addDoc, getDocs, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface FitnessTrack {
    id?: string;
    name: string;
    url: string;
    bpm: number;
    tenantId: string;
    createdAt: Date;
}

export const uploadTrackFile = async (file: File, tenantId: string): Promise<string> => {
    const storageRef = ref(storage, `tenants/${tenantId}/fitness_tracks/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export const addFitnessTrack = async (track: Omit<FitnessTrack, 'id'>): Promise<string> => {
    const colRef = collection(db, "fitness_tracks");
    const docRef = await addDoc(colRef, {
        ...track,
        createdAt: new Date()
    });
    return docRef.id;
};

export const getFitnessTracks = async (tenantId: string): Promise<FitnessTrack[]> => {
    const colRef = collection(db, "fitness_tracks");
    const q = query(colRef, where("tenantId", "==", tenantId));
    const snapshot = await getDocs(q);
    const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FitnessTrack));
    return tracks.sort((a, b) => a.name.localeCompare(b.name));
};

export const deleteFitnessTrack = async (trackId: string, fileUrl: string) => {
    // Delete from storage
    try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    } catch (e) {
        console.warn("Storage file might not exist or already deleted", e);
    }
    
    // Delete from firestore
    await deleteDoc(doc(db, "fitness_tracks", trackId));
};
