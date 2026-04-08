import { storage } from "../firebase";
import { dbList, dbAdd, dbDelete } from "./apiBridge";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface FitnessTrack {
    id?: string;
    name: string;
    url: string;
    bpm: number;
    tenantId: string;
    createdAt: any;
}

export const uploadTrackFile = async (file: File, tenantId: string): Promise<string> => {
    const storageRef = ref(storage, `tenants/${tenantId}/fitness_tracks/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export const addFitnessTrack = async (track: Omit<FitnessTrack, 'id'>): Promise<string> => {
    const res = await dbAdd("fitness_tracks", {
        ...track,
        createdAt: new Date().toISOString()
    });
    return res.id;
};

export const getFitnessTracks = async (tenantId: string): Promise<FitnessTrack[]> => {
    const list = await dbList("fitness_tracks", [
        { field: "tenantId", operator: "==", value: tenantId }
    ]);
    return list.sort((a: any, b: any) => a.name.localeCompare(b.name));
};

export const deleteFitnessTrack = async (trackId: string, fileUrl: string) => {
    // Delete from storage
    try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    } catch (e) {
        console.warn("Storage file might not exist or already deleted", e);
    }
    
    // Delete from firestore via proxy
    await dbDelete("fitness_tracks", trackId);
};
