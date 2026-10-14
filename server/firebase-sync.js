const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, deleteDoc } = require('firebase/firestore');

// Firebase configuration for ParkSmart (parksmart-fb86b)
const firebaseConfig = {
  apiKey: "AIzaSyAKAYWDCV0IfAK0rinieCmLh0oDwfnRJv0",
  authDomain: "parksmart-fb86b.firebaseapp.com",
  projectId: "parksmart-fb86b",
  storageBucket: "parksmart-fb86b.firebasestorage.app",
  messagingSenderId: "509047033537",
  appId: "1:509047033537:web:ec4c7681d7a67930328e40"
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

// Table configuration mapping Entity Name to its Primary Key
const ENTITY_CONFIG = {
  Customer: 'Customer_ID',
  Parking_Owner: 'ParkingOwner_ID',
  Administrator: 'Admin_ID',
  ParkingLot: 'Lot_ID',
  ParkingSlot: 'Slot_ID',
  Reservation: 'Booking_ID',
  Reservation_Detail: 'Detail_ID',
  UsageLog: 'Log_ID',
  Payment: 'Payment_ID',
  Complaint: 'Complaint_ID',
  AuditLog: 'Audit_ID',
  FavoriteLot: 'Favorite_ID'
};

/**
 * Sync a single record to Firestore collection under its Entity name and Attributes
 */
async function syncEntityRecord(entityName, record) {
  try {
    const pk = ENTITY_CONFIG[entityName];
    if (!pk || !record || record[pk] === undefined) return;
    const docId = String(record[pk]);
    
    // Clean undefined values
    const cleanRecord = {};
    for (const [key, val] of Object.entries(record)) {
      cleanRecord[key] = val === undefined ? null : val;
    }

    await setDoc(doc(firestoreDb, entityName, docId), {
      ...cleanRecord,
      _firebase_synced_at: new Date().toISOString()
    }, { merge: true });
    
    // console.log(`[Firebase Sync] Synced ${entityName} #${docId}`);
  } catch (err) {
    console.warn(`[Firebase Sync Warning] Failed to sync ${entityName}:`, err.message);
  }
}

/**
 * Delete a record from Firestore collection
 */
async function deleteEntityRecord(entityName, id) {
  try {
    if (!id) return;
    await deleteDoc(doc(firestoreDb, entityName, String(id)));
    // console.log(`[Firebase Sync] Deleted ${entityName} #${id}`);
  } catch (err) {
    console.warn(`[Firebase Sync Warning] Failed to delete ${entityName}:`, err.message);
  }
}

/**
 * Full Sync: exports all records from all 12 SQLite tables into Firebase Firestore
 */
async function syncAllDatabaseToFirebase(db) {
  console.log('🔄 Starting Full Sync of all SQLite Entities to Firebase Cloud Firestore...');
  const results = {};

  for (const [entityName, pk] of Object.entries(ENTITY_CONFIG)) {
    try {
      const rows = db.prepare(`SELECT * FROM ${entityName}`).all();
      results[entityName] = rows.length;

      for (const row of rows) {
        await syncEntityRecord(entityName, row);
      }
      console.log(`✅ Synced Entity [${entityName}]: ${rows.length} records`);
    } catch (err) {
      console.error(`❌ Error syncing Entity [${entityName}]:`, err.message);
      results[entityName] = `Error: ${err.message}`;
    }
  }

  console.log('🎉 Full Sync to Firebase Cloud Firestore Completed!');
  return results;
}

module.exports = {
  firestoreDb,
  ENTITY_CONFIG,
  syncEntityRecord,
  deleteEntityRecord,
  syncAllDatabaseToFirebase
};
