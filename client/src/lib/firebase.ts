import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for ParkSmart (parksmart-fb86b)
const firebaseConfig = {
  apiKey: "AIzaSyAKAYWDCV0IfAK0rinieCmLh0oDwfnRJv0",
  authDomain: "parksmart-fb86b.firebaseapp.com",
  projectId: "parksmart-fb86b",
  storageBucket: "parksmart-fb86b.firebasestorage.app",
  messagingSenderId: "509047033537",
  appId: "1:509047033537:web:ec4c7681d7a67930328e40",
  measurementId: "G-B29N6BXXYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };

// Sync booking to Cloud Firestore in real-time
export async function syncBookingToFirestore(bookingData: any) {
  try {
    if (!bookingData || !bookingData.bookingId) return;
    const bookingRef = doc(db, 'bookings', String(bookingData.bookingId));
    await setDoc(bookingRef, {
      ...bookingData,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ ซิงค์ข้อมูลการจองไปยัง Cloud Firestore เรียบร้อย:', bookingData.bookingId);
  } catch (err) {
    console.warn('⚠️ ไม่สามารถซิงค์ Firestore ได้:', err);
  }
}