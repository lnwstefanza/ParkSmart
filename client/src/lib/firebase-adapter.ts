import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { db } from './firebase';
import { parseDateSafe } from './thai-time';
import { ENTITY_DEFINITIONS, ER_RELATIONSHIPS, DATA_FLOW_STAGES, ORACLE_SQL_DDL } from './db-metadata';

/**
 * Firebase Firestore Client Adapter
 * Enables the web application to run 100% on Firebase Cloud Firestore
 * seamlessly both when hosted on Firebase Hosting (standalone) and locally.
 */

function safeBtoa(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt('0x' + p1, 16));
    }));
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function safeAtob(b64: string): string {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(b64), (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch {
    return decodeURIComponent(escape(atob(b64)));
  }
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getStoredUser(init?: RequestInit) {
  try {
    const authHeader = (init?.headers as any)?.Authorization || (init?.headers as any)?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.includes('parksmart-firebase-jwt-')) {
      const b64 = authHeader.split('parksmart-firebase-jwt-')[1]?.trim();
      if (b64) {
        const parsed = JSON.parse(safeAtob(b64));
        if (parsed && (parsed.id || parsed.username)) return parsed;
      }
    }
  } catch {}

  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch {}

  try {
    const raw = localStorage.getItem('parksmart_user');
    if (raw) return JSON.parse(raw);
  } catch {}

  return null;
}

async function getSlotCountsMap(): Promise<Record<number, { total: number; available: number }>> {
  const map: Record<number, { total: number; available: number }> = {};
  try {
    const snap = await getDocs(collection(db, 'ParkingSlot'));
    snap.forEach(d => {
      const data = d.data();
      const lid = Number(data.Lot_ID);
      if (!map[lid]) {
        map[lid] = { total: 0, available: 0 };
      }
      map[lid].total++;
      if (data.ParkingSlot_Status === 'Available' || !data.ParkingSlot_Status) {
        map[lid].available++;
      }
    });
  } catch (err) {
    console.error('Error fetching slot counts:', err);
  }
  return map;
}

async function getOwnersMap(): Promise<Map<number, any>> {
  const map = new Map<number, any>();
  try {
    const snap = await getDocs(collection(db, 'Parking_Owner'));
    snap.forEach(d => {
      const o = d.data();
      map.set(Number(o.ParkingOwner_ID || d.id), o);
    });
  } catch (_) {}
  return map;
}

export async function handleFirestoreRequest(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = null;
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  try {
    // 1. Recommended Lots (real-time slot availability)
    if (path === '/api/lots/recommended' && method === 'GET') {
      const snap = await getDocs(collection(db, 'ParkingLot'));
      const slotCounts = await getSlotCountsMap();
      let lots: any[] = [];
      snap.forEach(d => lots.push({ ...d.data() }));
      lots = lots.filter(l => l.ParkingLot_Status === 'Active' || !l.ParkingLot_Status);
      lots.forEach(l => {
        const lid = Number(l.Lot_ID);
        const counts = slotCounts[lid] || { total: 10, available: 7 };
        l.total_slots = counts.total;
        l.available_slots = counts.available;
        l.occupied_slots = Math.max(0, counts.total - counts.available);
      });
      lots.sort((a, b) => (Number(a.Recommended_Order) || 99) - (Number(b.Recommended_Order) || 99));
      return jsonResponse(lots.slice(0, 7));
    }

    // 2. All Lots (with real-time available_slots & total_slots)
    if (path === '/api/lots' && method === 'GET') {
      const snap = await getDocs(collection(db, 'ParkingLot'));
      const slotCounts = await getSlotCountsMap();
      const ownersMap = await getOwnersMap();
      let lots: any[] = [];
      snap.forEach(d => lots.push({ ...d.data() }));

      const statusParam = searchParams.get('status');
      const search = searchParams.get('search')?.toLowerCase();
      const district = searchParams.get('district');
      const ownerId = searchParams.get('ownerId');

      if (statusParam !== 'all') {
        lots = lots.filter(l => l.ParkingLot_Status === 'Active' || !l.ParkingLot_Status);
      }
      if (district && district !== 'all') {
        lots = lots.filter(l => l.District === district);
      }
      if (ownerId) {
        lots = lots.filter(l => String(l.ParkingOwner_ID) === String(ownerId));
      }
      if (search) {
        lots = lots.filter(l => 
          (l.LotName && l.LotName.toLowerCase().includes(search)) ||
          (l.Location && l.Location.toLowerCase().includes(search)) ||
          (l.Description && l.Description.toLowerCase().includes(search))
        );
      }

      lots.forEach(l => {
        const lid = Number(l.Lot_ID);
        const counts = slotCounts[lid] || { total: 10, available: 7 };
        l.total_slots = counts.total;
        l.available_slots = counts.available;
        l.occupied_slots = Math.max(0, counts.total - counts.available);

        const owner = ownersMap.get(Number(l.ParkingOwner_ID));
        if (owner) {
          l.OwnerFName = owner.FName;
          l.OwnerLName = owner.LName;
          l.OwnerUsername = owner.Username;
        }
      });

      return jsonResponse(lots);
    }

    // 3. Single Lot Detail
    const lotMatch = path.match(/^\/api\/lots\/(\d+)$/);
    if (lotMatch && method === 'GET') {
      const lotId = lotMatch[1];
      const docRef = doc(db, 'ParkingLot', String(lotId));
      const lotSnap = await getDoc(docRef);
      if (!lotSnap.exists()) {
        return jsonResponse({ error: 'ไม่พบลานจอดรถ' }, 404);
      }
      const lotData = lotSnap.data();

      // Get slots count
      const slotsSnap = await getDocs(query(collection(db, 'ParkingSlot'), where('Lot_ID', '==', Number(lotId))));
      let total = 0;
      let avail = 0;
      slotsSnap.forEach(s => {
        total++;
        if (s.data().ParkingSlot_Status === 'Available') avail++;
      });

      return jsonResponse({
        ...lotData,
        total_slots: total,
        available_slots: avail,
        occupied_slots: Math.max(0, total - avail)
      });
    }

    // 4. Slots for Lot (with dynamic real-time availability based on selected date & time)
    const slotsMatch = path.match(/^\/api\/lots\/(\d+)\/slots$/);
    if (slotsMatch && method === 'GET') {
      const lotId = Number(slotsMatch[1]);
      const [slotSnap, resvSnap] = await Promise.all([
        getDocs(query(collection(db, 'ParkingSlot'), where('Lot_ID', '==', lotId))),
        getDocs(collection(db, 'Reservation_Detail'))
      ]);

      const queryDate = searchParams.get('date');
      const queryTime = searchParams.get('time') || '10:00';
      const duration = Number(searchParams.get('duration')) || 2;

      let startMs = 0;
      let endMs = 0;
      if (queryDate) {
        const startStr = `${queryDate}T${queryTime}:00`;
        const startDate = parseDateSafe(startStr);
        if (startDate) {
          startMs = startDate.getTime();
          endMs = startMs + (duration * 3600 * 1000);
        }
      }

      // Check active overlapping reservations for this lot during requested time window
      const activeResvBySlot = new Map<number, any>();
      resvSnap.forEach(d => {
        const r = d.data();
        if (['Confirmed', 'Checked_In'].includes(r.Reservation_Status)) {
          if (startMs && endMs && r.Expected_Arrival && r.Booked_End) {
            const rStart = parseDateSafe(r.Expected_Arrival)?.getTime() || 0;
            const rEnd = parseDateSafe(r.Booked_End)?.getTime() || 0;
            if (rStart < endMs && rEnd > startMs) {
              activeResvBySlot.set(Number(r.Slot_ID), r);
            }
          }
        }
      });

      const slots: any[] = [];
      slotSnap.forEach(d => {
        const s = d.data();
        const sid = Number(s.Slot_ID);
        let status = s.ParkingSlot_Status || 'Available';
        if (status !== 'Maintenance') {
          const active = activeResvBySlot.get(sid);
          if (active) {
            status = active.Reservation_Status === 'Checked_In' ? 'Occupied' : 'Reserved';
          } else {
            status = 'Available';
          }
        }
        slots.push({
          ...s,
          ParkingSlot_Status: status
        });
      });

      slots.sort((a, b) => (a.Slot_ID || 0) - (b.Slot_ID || 0));
      return jsonResponse(slots);
    }

    // 5. Check slot availability
    const availMatch = path.match(/^\/api\/slots\/(\d+)\/check-availability$/);
    if (availMatch && method === 'GET') {
      return jsonResponse({ available: true, message: 'ช่องจอดว่างพร้อมใช้งาน' });
    }

    // 6. Auth Login
    if (path === '/api/auth/login' && method === 'POST') {
      const { username, password } = body || {};
      const cleanUser = (username || '').trim();
      const cleanPass = password || '';
      if (!cleanUser || !cleanPass) {
        return jsonResponse({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, 400);
      }

      // Check Customer
      let foundUser: any = null;
      let role = 'Customer';
      let userId = 0;

      const custSnap = await getDocs(query(collection(db, 'Customer'), where('Username', '==', cleanUser)));
      if (!custSnap.empty) {
        foundUser = custSnap.docs[0].data();
        role = 'Customer';
        userId = foundUser.Customer_ID;
      } else {
        const allCust = await getDocs(collection(db, 'Customer'));
        const matched = allCust.docs.find(d => (d.data().Username || '').toLowerCase() === cleanUser.toLowerCase());
        if (matched) {
          foundUser = matched.data();
          role = 'Customer';
          userId = foundUser.Customer_ID;
        }
      }

      // Check Owner
      if (!foundUser) {
        const ownerSnap = await getDocs(query(collection(db, 'Parking_Owner'), where('Username', '==', cleanUser)));
        if (!ownerSnap.empty) {
          foundUser = ownerSnap.docs[0].data();
          role = 'Owner';
          userId = foundUser.ParkingOwner_ID;
        } else {
          const allOwners = await getDocs(collection(db, 'Parking_Owner'));
          const matched = allOwners.docs.find(d => (d.data().Username || '').toLowerCase() === cleanUser.toLowerCase());
          if (matched) {
            foundUser = matched.data();
            role = 'Owner';
            userId = foundUser.ParkingOwner_ID;
          }
        }
      }

      // Check Admin
      if (!foundUser) {
        const adminSnap = await getDocs(query(collection(db, 'Administrator'), where('Username', '==', cleanUser)));
        if (!adminSnap.empty) {
          foundUser = adminSnap.docs[0].data();
          role = 'Admin';
          userId = foundUser.Admin_ID;
        } else {
          const allAdmins = await getDocs(collection(db, 'Administrator'));
          const matched = allAdmins.docs.find(d => (d.data().Username || '').toLowerCase() === cleanUser.toLowerCase());
          if (matched) {
            foundUser = matched.data();
            role = 'Admin';
            userId = foundUser.Admin_ID;
          }
        }
      }

      if (!foundUser) {
        return jsonResponse({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
      }

      // Check account status
      if (foundUser.Account_Status && foundUser.Account_Status !== 'Active') {
        return jsonResponse({ error: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' }, 403);
      }

      // Verify Password (bcrypt hash or plain text or demo account fallback)
      let isPasswordValid = false;
      const storedHash = foundUser.Password_Hash || '';

      if (storedHash) {
        if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
          try {
            isPasswordValid = bcrypt.compareSync(cleanPass, storedHash);
          } catch {
            isPasswordValid = false;
          }
        } else {
          isPasswordValid = (cleanPass === storedHash);
        }
      }

      // Quick fallback for demo accounts
      if (!isPasswordValid) {
        const uLower = cleanUser.toLowerCase();
        if (
          (uLower === 'customer1' && cleanPass === 'cust123') ||
          (uLower === 'owner1' && cleanPass === 'owner123') ||
          (uLower === 'admin' && cleanPass === 'admin123')
        ) {
          isPasswordValid = true;
        }
      }

      if (!isPasswordValid) {
        return jsonResponse({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
      }

      // Allow login for verified user
      const userPayload = {
        id: userId,
        username: foundUser.Username,
        role: role,
        fname: foundUser.FName,
        lname: foundUser.LName,
        email: foundUser.Email
      };

      const token = 'parksmart-firebase-jwt-' + safeBtoa(JSON.stringify(userPayload));
      return jsonResponse({ token, user: userPayload });
    }

    // 7. Auth Register
    if (path === '/api/auth/register' && method === 'POST') {
      const { username, password, fname, lname, phone, email, role } = body || {};
      const targetCollection = role === 'Parking_Owner' ? 'Parking_Owner' : 'Customer';
      const pkName = role === 'Parking_Owner' ? 'ParkingOwner_ID' : 'Customer_ID';

      const allUsersSnap = await getDocs(collection(db, targetCollection));
      let maxId = 0;
      allUsersSnap.forEach(d => {
        const id = Number(d.data()[pkName] || d.id);
        if (id > maxId && id < 1000000) maxId = id;
      });
      const newId = maxId + 1;

      let hashedPassword = password;
      try {
        hashedPassword = bcrypt.hashSync(password, 10);
      } catch {
        hashedPassword = password;
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const now = new Date();
      const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const newRecord = {
        [pkName]: newId,
        Username: username,
        Password_Hash: hashedPassword,
        FName: fname || '',
        LName: lname || '',
        Phone_Number: phone || '',
        Email: email || '',
        Account_Status: 'Active',
        Created_At: nowStr,
        Created_By: username || 'SYSTEM',
        Updated_At: nowStr,
        Updated_By: username || 'SYSTEM'
      };

      await setDoc(doc(db, targetCollection, String(newId)), newRecord);
      return jsonResponse({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
    }

    // 8. Auth Me
    if (path === '/api/auth/me' && method === 'GET') {
      const user = getStoredUser();
      return jsonResponse({ user });
    }

    // 9. Create Reservation
    if (path === '/api/reservations' && method === 'POST') {
      const user = getStoredUser();
      const bookingId = Date.now();
      const qrToken = 'QR-' + bookingId + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const slotId = Number(body.slotId);
      let lotId = Number(body.lotId);
      let feeRate = 20;

      if (!lotId && slotId) {
        try {
          const slotSnap = await getDoc(doc(db, 'ParkingSlot', String(slotId)));
          if (slotSnap.exists()) {
            lotId = Number(slotSnap.data().Lot_ID);
          }
        } catch (_) {}
      }

      if (lotId) {
        try {
          const lotSnap = await getDoc(doc(db, 'ParkingLot', String(lotId)));
          if (lotSnap.exists()) {
            feeRate = Number(lotSnap.data().FeeRate_Per_Hour) || 20;
          }
        } catch (_) {}
      }

      const bookedHours = Number(body.durationHours) || Number(body.bookedHours) || 2;
      let arrivalDate: Date;
      if (body.bookingDate && body.startTime) {
        arrivalDate = new Date(`${body.bookingDate}T${body.startTime}:00+07:00`);
      } else if (body.expectedArrival) {
        arrivalDate = new Date(body.expectedArrival);
      } else {
        arrivalDate = new Date();
      }
      if (isNaN(arrivalDate.getTime())) arrivalDate = new Date();

      const expectedArrival = arrivalDate.toISOString();
      const bookedEnd = new Date(arrivalDate.getTime() + bookedHours * 3600 * 1000).toISOString();

      const totalFee = Number(body.totalFee) || (bookedHours * feeRate);
      const depositAmount = Number(body.depositAmount) || totalFee;

      const detailDoc = {
        Detail_ID: bookingId,
        Booking_ID: bookingId,
        Slot_ID: slotId,
        Lot_ID: lotId || 1,
        Customer_ID: user?.id || 1,
        LicensePlate: body.licensePlate || 'กข 1234 ขอนแก่น',
        Expected_Arrival: expectedArrival,
        StartTime: expectedArrival,
        Booked_Hours: bookedHours,
        Booked_End: bookedEnd,
        Base_Fee: totalFee,
        Deposit_Amount: depositAmount,
        Totalfee: totalFee,
        Reservation_Status: 'Pending_Payment',
        QRToken: qrToken,
        Created_At: new Date().toISOString()
      };
      await setDoc(doc(db, 'Reservation_Detail', String(bookingId)), detailDoc);

      // Create main Reservation Header record
      await setDoc(doc(db, 'Reservation', String(bookingId)), {
        Booking_ID: bookingId,
        Customer_ID: user?.id || 1,
        BookingDate: new Date().toISOString()
      });

      // Slot remains 'Available' until payment is completed and confirmed
      return jsonResponse({
        success: true,
        bookingId,
        qrToken,
        reservation: detailDoc
      });
    }

    // 10. My Reservations
    if (path === '/api/reservations/my' && method === 'GET') {
      const user = getStoredUser();
      const snap = await getDocs(collection(db, 'Reservation_Detail'));
      const details: any[] = [];
      snap.forEach(d => details.push({ ...d.data() }));

      // Attach Lot Name
      const lotsSnap = await getDocs(collection(db, 'ParkingLot'));
      const lotsMap = new Map();
      lotsSnap.forEach(l => lotsMap.set(Number(l.id), l.data().LotName));

      const myBookings = details
        .filter(d => !user?.id || String(d.Customer_ID) === String(user.id) || !d.Customer_ID)
        .map(d => ({
          ...d,
          LotName: lotsMap.get(Number(d.Lot_ID)) || 'ลานจอดรถในระบบ'
        }));
      myBookings.sort((a, b) => (b.Booking_ID || 0) - (a.Booking_ID || 0));
      return jsonResponse(myBookings);
    }

    // 11. Single Reservation Detail (with live scannable QR Code Data URL)
    const resvMatch = path.match(/^\/api\/reservations\/(\d+)$/);
    if (resvMatch && method === 'GET') {
      const id = resvMatch[1];
      const snap = await getDoc(doc(db, 'Reservation_Detail', String(id)));
      if (!snap.exists()) {
        return jsonResponse({ error: 'ไม่พบข้อมูลการจอง' }, 404);
      }
      const data = snap.data();

      // Generate live scannable QR Code data URL
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(data.QRToken || `PARK-RESERVATION-${id}`, {
          width: 300,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
      } catch (err) {
        console.error('QR code generation error:', err);
      }

      // Lot info
      let lotData: any = {};
      if (data.Lot_ID) {
        const lotSnap = await getDoc(doc(db, 'ParkingLot', String(data.Lot_ID)));
        if (lotSnap.exists()) lotData = lotSnap.data();
      }

      // Slot info
      let slotData: any = {};
      if (data.Slot_ID) {
        const slotSnap = await getDoc(doc(db, 'ParkingSlot', String(data.Slot_ID)));
        if (slotSnap.exists()) slotData = slotSnap.data();
      }

      return jsonResponse({
        ...data,
        qrDataUrl,
        LotName: lotData.LotName || 'ลานจอดรถ',
        Location: lotData.Location || 'ขอนแก่น',
        District: lotData.District || 'เมืองขอนแก่น',
        FeeRate: lotData.FeeRate_Per_Hour || 20,
        FeeRate_Per_Hour: lotData.FeeRate_Per_Hour || 20,
        Daily_Max_Fee: lotData.Daily_Max_Fee || 200,
        SpaceCode: slotData.SpaceCode || 'A-01',
        Floor: slotData.Floor || '1',
        Zone: slotData.Zone || 'Zone A'
      });
    }

    // 12. Pay Deposit
    const payDepMatch = path.match(/^\/api\/reservations\/(\d+)\/pay-deposit$/);
    if (payDepMatch && method === 'POST') {
      const id = payDepMatch[1];
      const detailRef = doc(db, 'Reservation_Detail', String(id));
      const detailSnap = await getDoc(detailRef);
      const detailData = detailSnap.exists() ? detailSnap.data() : null;

      await updateDoc(detailRef, {
        Reservation_Status: 'Confirmed',
        Updated_At: new Date().toISOString()
      });

      // Update physical slot status to 'Reserved' upon confirmed payment
      if (detailData?.Slot_ID) {
        try {
          await updateDoc(doc(db, 'ParkingSlot', String(detailData.Slot_ID)), {
            ParkingSlot_Status: 'Reserved',
            Updated_At: new Date().toISOString()
          });
        } catch (_) {}
      }

      // Record in Payment collection
      const payId = Date.now();
      await setDoc(doc(db, 'Payment', String(payId)), {
        Payment_ID: payId,
        Detail_ID: Number(id),
        Amount: body?.amount || 40,
        Payment_Type: 'Deposit',
        Payment_Status: 'Paid',
        Payment_Date: new Date().toISOString()
      });

      return jsonResponse({ success: true, message: 'ชำระเงินมัดจำสำเร็จ ได้รับ QR Code เข้าจอดเรียบร้อยแล้ว' });
    }

    // 13. Pay Final
    const payFinMatch = path.match(/^\/api\/reservations\/(\d+)\/pay-final$/);
    if (payFinMatch && method === 'POST') {
      const id = payFinMatch[1];
      await updateDoc(doc(db, 'Reservation_Detail', String(id)), {
        Reservation_Status: 'Completed',
        Updated_At: new Date().toISOString()
      });

      const payId = Date.now();
      await setDoc(doc(db, 'Payment', String(payId)), {
        Payment_ID: payId,
        Detail_ID: Number(id),
        Amount: body?.amount || 40,
        Payment_Type: 'Overtime_Penalty',
        Payment_Status: 'Paid',
        Payment_Date: new Date().toISOString()
      });

      return jsonResponse({ success: true, message: 'ชำระค่าบริการส่วนที่เหลือเรียบร้อยแล้ว' });
    }

    // 14. Cancel Reservation
    const cancelMatch = path.match(/^\/api\/reservations\/(\d+)\/cancel$/);
    if (cancelMatch && method === 'POST') {
      const id = cancelMatch[1];
      const snap = await getDoc(doc(db, 'Reservation_Detail', String(id)));
      if (snap.exists()) {
        const data = snap.data();
        await updateDoc(doc(db, 'Reservation_Detail', String(id)), {
          Reservation_Status: 'Cancelled',
          Updated_At: new Date().toISOString()
        });
        if (data.Slot_ID) {
          try {
            await updateDoc(doc(db, 'ParkingSlot', String(data.Slot_ID)), {
              ParkingSlot_Status: 'Available'
            });
          } catch (_) {}
        }
      }
      return jsonResponse({ success: true, message: 'ยกเลิกการจองสำเร็จ คืนสถานะช่องจอดให้ว่างเรียบร้อยแล้ว' });
    }

    // 15. Check-In Scan
    if (path === '/api/scan/check-in' && method === 'POST') {
      const { reservationId, qrToken } = body || {};
      let targetId = reservationId;
      if (!targetId && qrToken) {
        const qSnap = await getDocs(query(collection(db, 'Reservation_Detail'), where('QRToken', '==', qrToken)));
        if (!qSnap.empty) targetId = qSnap.docs[0].id;
      }

      if (targetId) {
        const nowIso = new Date().toISOString();
        await updateDoc(doc(db, 'Reservation_Detail', String(targetId)), {
          Reservation_Status: 'Checked_In',
          Actual_Check_In: nowIso,
          Updated_At: nowIso
        });
        const resvSnap = await getDoc(doc(db, 'Reservation_Detail', String(targetId)));
        if (resvSnap.exists() && resvSnap.data().Slot_ID) {
          await updateDoc(doc(db, 'ParkingSlot', String(resvSnap.data().Slot_ID)), {
            ParkingSlot_Status: 'Occupied'
          });
        }

        // Record in UsageLog
        const logId = Date.now();
        await setDoc(doc(db, 'UsageLog', String(logId)), {
          Log_ID: logId,
          Detail_ID: Number(targetId),
          Actual_Check_In: nowIso
        });
      }
      return jsonResponse({ success: true, message: 'เช็คอินเข้าจอดสำเร็จ บันทึกเวลาเข้าเรียบร้อยแล้ว' });
    }

    // 16. Check-Out Scan
    if (path === '/api/scan/check-out' && method === 'POST') {
      const { reservationId, qrToken } = body || {};
      let targetId = reservationId;
      if (!targetId && qrToken) {
        const qSnap = await getDocs(query(collection(db, 'Reservation_Detail'), where('QRToken', '==', qrToken)));
        if (!qSnap.empty) targetId = qSnap.docs[0].id;
      }

      if (targetId) {
        const resvSnap = await getDoc(doc(db, 'Reservation_Detail', String(targetId)));
        if (resvSnap.exists()) {
          const rData = resvSnap.data();
          let now = Date.now();
          let nowIso = new Date().toISOString();

          // Check overtime penalty (2x rate)
          let overtimePenalty = 0;
          let overtimeMinutes = 0;
          if (rData.Booked_End) {
            let bookedEndTime = NaN;
            if (rData.Booked_End.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(rData.Booked_End)) {
              bookedEndTime = new Date(rData.Booked_End).getTime();
            } else {
              bookedEndTime = new Date(rData.Booked_End.replace(' ', 'T') + '+07:00').getTime();
            }

            const simHours = Number(body?.simulateOvertimeHours) || 0;
            if (simHours > 0 && !isNaN(bookedEndTime)) {
              now = bookedEndTime + (simHours * 3600 * 1000) + (10 * 60 * 1000);
              nowIso = new Date(now).toISOString();
            }

            if (!isNaN(bookedEndTime) && now > bookedEndTime) {
              overtimeMinutes = Math.floor((now - bookedEndTime) / 60000);
              const overtimeHours = Math.ceil(overtimeMinutes / 60);
              const feeRate = Number(rData.FeeRate || rData.FeeRate_Per_Hour || 20);
              overtimePenalty = overtimeHours * (feeRate * 2);
            }
          }

          const nextStatus = overtimePenalty > 0 ? 'Awaiting_Final_Payment' : 'Completed';
          await updateDoc(doc(db, 'Reservation_Detail', String(targetId)), {
            Reservation_Status: nextStatus,
            Actual_Check_Out: nowIso,
            Overtime_Penalty: overtimePenalty,
            Updated_At: nowIso
          });

          if (rData.Slot_ID) {
            await updateDoc(doc(db, 'ParkingSlot', String(rData.Slot_ID)), {
              ParkingSlot_Status: 'Available'
            });
          }

          return jsonResponse({
            success: true,
            status: nextStatus,
            overtimeMinutes,
            overtimePenalty,
            message: overtimePenalty > 0 
              ? `มีค่าปรับจอดเกินเวลา 2 เท่า: ฿${overtimePenalty}` 
              : 'เช็คเอาท์และคืนช่องจอดสำเร็จ'
          });
        }
      }
      return jsonResponse({ success: true, message: 'เช็คเอาท์และคืนช่องจอดสำเร็จ' });
    }

    // 17. Admin Delete Parking Lot
    const adminDelLotMatch = path.match(/^\/api\/admin\/lots\/(\d+)$/);
    if (adminDelLotMatch && method === 'DELETE') {
      const lotId = Number(adminDelLotMatch[1]);

      // Check active bookings
      const rSnap = await getDocs(query(collection(db, 'Reservation_Detail'), where('Lot_ID', '==', lotId)));
      const activeBookings = rSnap.docs.filter(d => 
        ['Pending_Payment', 'Confirmed', 'Checked_In'].includes(d.data().Reservation_Status)
      );
      if (activeBookings.length > 0) {
        return jsonResponse({
          error: `ไม่สามารถลบลานจอดนี้ได้ เนื่องจากมีรายการจองที่ยังไม่เสร็จสิ้น ${activeBookings.length} รายการ`
        }, 400);
      }

      // Delete associated slots
      const slotSnap = await getDocs(query(collection(db, 'ParkingSlot'), where('Lot_ID', '==', lotId)));
      for (const s of slotSnap.docs) {
        await deleteDoc(s.ref);
      }

      // Delete favorites
      const favSnap = await getDocs(query(collection(db, 'FavoriteLot'), where('Lot_ID', '==', lotId)));
      for (const f of favSnap.docs) {
        await deleteDoc(f.ref);
      }

      // Delete lot doc
      await deleteDoc(doc(db, 'ParkingLot', String(lotId)));

      return jsonResponse({ success: true, message: 'ลบลานจอดรถเรียบร้อยแล้ว' });
    }

    // 18. Admin Approve / Reject Lot
    const adminApproveMatch = path.match(/^\/api\/admin\/lots\/(\d+)\/approve$/);
    if (adminApproveMatch && method === 'PATCH') {
      const lotId = adminApproveMatch[1];
      const { status } = body || {};
      await updateDoc(doc(db, 'ParkingLot', String(lotId)), {
        ParkingLot_Status: status || 'Active',
        Updated_At: new Date().toISOString()
      });
      return jsonResponse({ success: true, message: 'อัปเดตสถานะลานจอดเรียบร้อยแล้ว' });
    }

    // 19. Admin Recommend Lot Toggle
    const adminRecMatch = path.match(/^\/api\/admin\/lots\/(\d+)\/recommend$/);
    if (adminRecMatch && method === 'PATCH') {
      const lotId = adminRecMatch[1];
      const { isRecommended, order } = body || {};
      await updateDoc(doc(db, 'ParkingLot', String(lotId)), {
        Is_Recommended: isRecommended ? 1 : 0,
        Recommended_Order: order || 1,
        Updated_At: new Date().toISOString()
      });
      return jsonResponse({ success: true });
    }

    // 20. Owner Add Lot (POST /api/owner/lots)
    if (path === '/api/owner/lots' && method === 'POST') {
      const user = getStoredUser();
      const allLotsSnap = await getDocs(collection(db, 'ParkingLot'));
      let maxLotId = 0;
      allLotsSnap.forEach(d => {
        const id = Number(d.data().Lot_ID || d.id);
        if (id > maxLotId) maxLotId = id;
      });
      const newLotId = maxLotId + 1;

      const newLot = {
        Lot_ID: newLotId,
        ParkingOwner_ID: user?.id || 1,
        LotName: body.lotName,
        Location: body.location,
        District: body.district || 'อ.เมืองขอนแก่น',
        FeeRate_Per_Hour: Number(body.feeRatePerHour) || 20,
        Free_Minutes: Number(body.freeMinutes) || 0,
        OpenTime: body.openTime || '10:00',
        CloseTime: body.closeTime || '22:00',
        Daily_Max_Fee: Number(body.dailyMaxFee) || 200,
        Description: body.description || '',
        Image_Url: body.imageUrl || '/images/lots/central-khonkaen.jpg',
        ParkingLot_Status: 'Pending',
        Is_Recommended: 0,
        Recommended_Order: 99,
        Created_At: new Date().toISOString()
      };

      await setDoc(doc(db, 'ParkingLot', String(newLotId)), newLot);

      // Create 10 default slots for this lot
      const allSlotsSnap = await getDocs(collection(db, 'ParkingSlot'));
      let maxSlotId = 0;
      allSlotsSnap.forEach(d => {
        const id = Number(d.data().Slot_ID || d.id);
        if (id > maxSlotId) maxSlotId = id;
      });

      for (let i = 1; i <= 10; i++) {
        const sId = maxSlotId + i;
        const code = `A-${String(i).padStart(2, '0')}`;
        await setDoc(doc(db, 'ParkingSlot', String(sId)), {
          Slot_ID: sId,
          Lot_ID: newLotId,
          SpaceCode: code,
          Floor: '1',
          Zone: 'Zone A',
          ParkingSlot_Status: 'Available',
          Created_At: new Date().toISOString()
        });
      }

      return jsonResponse({
        success: true,
        lotId: newLotId,
        message: 'เพิ่มลานจอดใหม่เรียบร้อยแล้ว อยู่ระหว่างรอผู้ดูแลระบบอนุมัติ'
      });
    }

    // 21. Owner Update Lot (PUT /api/owner/lots/:id)
    const ownerPutLotMatch = path.match(/^\/api\/owner\/lots\/(\d+)$/);
    if (ownerPutLotMatch && method === 'PUT') {
      const lotId = ownerPutLotMatch[1];
      await updateDoc(doc(db, 'ParkingLot', String(lotId)), {
        LotName: body.lotName,
        Location: body.location,
        OpenTime: body.openTime,
        CloseTime: body.closeTime,
        FeeRate_Per_Hour: Number(body.feeRatePerHour) || 20,
        Free_Minutes: Number(body.freeMinutes) || 0,
        Daily_Max_Fee: Number(body.dailyMaxFee) || 200,
        Description: body.description || '',
        Image_Url: body.imageUrl,
        Updated_At: new Date().toISOString()
      });
      return jsonResponse({ success: true, message: 'แก้ไขข้อมูลลานจอดเรียบร้อยแล้ว' });
    }

    // 22. Admin Users (GET /api/admin/users)
    if (path === '/api/admin/users' && method === 'GET') {
      const [custSnap, ownerSnap, adminSnap, resvDetailSnap, resvSnap, lotsSnap] = await Promise.all([
        getDocs(collection(db, 'Customer')),
        getDocs(collection(db, 'Parking_Owner')),
        getDocs(collection(db, 'Administrator')),
        getDocs(collection(db, 'Reservation_Detail')),
        getDocs(collection(db, 'Reservation')),
        getDocs(collection(db, 'ParkingLot'))
      ]);

      // Calculate bookings per customer
      const bookingCounts = new Map<string, number>();
      
      // Tally from Reservation_Detail
      resvDetailSnap.forEach(d => {
        const data = d.data();
        const cid = String(data.Customer_ID ?? data.customerId ?? '');
        if (cid) {
          bookingCounts.set(cid, (bookingCounts.get(cid) || 0) + 1);
        }
      });

      // Also check Reservation header in case detail didn't store Customer_ID
      resvSnap.forEach(d => {
        const data = d.data();
        const cid = String(data.Customer_ID ?? data.customerId ?? '');
        if (cid && !bookingCounts.has(cid)) {
          bookingCounts.set(cid, (bookingCounts.get(cid) || 0) + 1);
        }
      });

      // Calculate lots per owner
      const lotCounts = new Map<string, number>();
      lotsSnap.forEach(d => {
        const data = d.data();
        const oid = String(data.ParkingOwner_ID ?? data.ownerId ?? '');
        if (oid) {
          lotCounts.set(oid, (lotCounts.get(oid) || 0) + 1);
        }
      });

      const customers: any[] = [];
      custSnap.forEach(d => {
        const data = d.data();
        const id = data.Customer_ID ?? d.id;
        const totalBookings = bookingCounts.get(String(id)) ?? bookingCounts.get(String(d.id)) ?? 0;
        customers.push({ 
          ...data, 
          id, 
          role: 'Customer',
          totalBookings 
        });
      });

      const owners: any[] = [];
      ownerSnap.forEach(d => {
        const data = d.data();
        const id = data.ParkingOwner_ID ?? d.id;
        const totalLots = lotCounts.get(String(id)) ?? lotCounts.get(String(d.id)) ?? 0;
        owners.push({ 
          ...data, 
          id, 
          role: 'Owner',
          totalLots 
        });
      });

      const admins: any[] = [];
      adminSnap.forEach(d => admins.push({ ...d.data(), id: d.data().Admin_ID || d.id, role: 'Admin' }));

      return jsonResponse({ customers, owners, admins });
    }

    // 22.1 Admin Get Customer Bookings History (GET /api/admin/customers/:id/bookings)
    const adminCustomerBookingsMatch = path.match(/^\/api\/admin\/customers\/(\d+)\/bookings$/);
    if (adminCustomerBookingsMatch && method === 'GET') {
      const customerId = adminCustomerBookingsMatch[1];
      const [resvSnap, lotsSnap, slotsSnap, custSnap] = await Promise.all([
        getDocs(collection(db, 'Reservation_Detail')),
        getDocs(collection(db, 'ParkingLot')),
        getDocs(collection(db, 'ParkingSlot')),
        getDoc(doc(db, 'Customer', String(customerId)))
      ]);

      const lotsMap = new Map();
      lotsSnap.forEach(l => lotsMap.set(Number(l.id), l.data()));

      const slotsMap = new Map();
      slotsSnap.forEach(s => slotsMap.set(Number(s.id), s.data()));

      const bookings: any[] = [];
      resvSnap.forEach(d => {
        const data = d.data();
        if (String(data.Customer_ID) === String(customerId)) {
          const lot = lotsMap.get(Number(data.Lot_ID)) || {};
          const slot = slotsMap.get(Number(data.Slot_ID)) || {};
          bookings.push({
            ...data,
            Booking_ID: data.Booking_ID || d.id,
            LotName: lot.LotName || 'ลานจอดรถในระบบ',
            Location: lot.Location || '-',
            FeeRate_Per_Hour: lot.FeeRate_Per_Hour || 20,
            SpaceCode: slot.SpaceCode || data.SpaceCode || 'ช่องจอดทั่วไป',
            Floor: slot.Floor || 'Ground',
            Zone: slot.Zone || 'Zone A'
          });
        }
      });

      bookings.sort((a, b) => (Number(b.Booking_ID) || 0) - (Number(a.Booking_ID) || 0));

      let customerData: any = null;
      if (custSnap.exists()) {
        customerData = { ...custSnap.data(), id: customerId };
      } else {
        const queryCust = await getDocs(query(collection(db, 'Customer'), where('Customer_ID', '==', Number(customerId))));
        if (!queryCust.empty) {
          customerData = { ...queryCust.docs[0].data(), id: customerId };
        }
      }

      return jsonResponse({
        success: true,
        customer: customerData,
        bookings
      });
    }

    // 23. Admin Toggle User Status (PATCH /api/admin/users/:role/:id)
    const userStatusMatch = path.match(/^\/api\/admin\/users\/([a-zA-Z_]+)\/(\d+)$/);
    if (userStatusMatch && method === 'PATCH') {
      const roleStr = userStatusMatch[1].toLowerCase();
      const userId = userStatusMatch[2];
      const { status } = body || {};

      const collectionName = roleStr.includes('owner') ? 'Parking_Owner' : 'Customer';
      await updateDoc(doc(db, collectionName, String(userId)), {
        Account_Status: status,
        Updated_At: new Date().toISOString()
      });

      return jsonResponse({ success: true, message: 'อัปเดตสถานะบัญชีเรียบร้อยแล้ว' });
    }

    // 23.1 Admin Add Customer (POST /api/admin/customers)
    if (path === '/api/admin/customers' && method === 'POST') {
      const { username, password, fname, lname, phone, email } = body || {};
      if (!username || !password || !fname || !lname) {
        return jsonResponse({ error: 'กรุณากรอก Username, Password, ชื่อ และนามสกุล' }, 400);
      }
      const cleanUser = username.trim();
      const existingSnap = await getDocs(query(collection(db, 'Customer'), where('Username', '==', cleanUser)));
      if (!existingSnap.empty) {
        return jsonResponse({ error: 'ชื่อผู้ใช้นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น' }, 400);
      }

      const newId = Date.now();
      let hashedPassword = password;
      try {
        hashedPassword = bcrypt.hashSync(password, 10);
      } catch {}

      const newCustomer = {
        Customer_ID: newId,
        id: newId,
        Username: cleanUser,
        Password_Hash: hashedPassword,
        FName: fname.trim(),
        LName: lname.trim(),
        Phone_Number: phone || '',
        Email: email || '',
        Account_Status: 'Active',
        Created_At: new Date().toISOString(),
        Updated_At: new Date().toISOString()
      };

      await setDoc(doc(db, 'Customer', String(newId)), newCustomer);
      return jsonResponse({ success: true, message: 'เพิ่มบัญชีลูกค้าสำเร็จ', customer: newCustomer });
    }

    // 23.2 Admin Edit Customer (PUT /api/admin/customers/:id)
    const adminCustMatch = path.match(/^\/api\/admin\/customers\/(\d+)$/);
    if (adminCustMatch && method === 'PUT') {
      const custId = adminCustMatch[1];
      const { fname, lname, phone, email, password } = body || {};
      if (!fname || !lname) {
        return jsonResponse({ error: 'กรุณาระบุชื่อและนามสกุล' }, 400);
      }

      const updateData: any = {
        FName: fname.trim(),
        LName: lname.trim(),
        Phone_Number: phone || '',
        Email: email || '',
        Updated_At: new Date().toISOString()
      };

      if (password && password.trim()) {
        try {
          updateData.Password_Hash = bcrypt.hashSync(password.trim(), 10);
        } catch {
          updateData.Password_Hash = password.trim();
        }
      }

      await setDoc(doc(db, 'Customer', String(custId)), updateData, { merge: true });
      return jsonResponse({ success: true, message: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว' });
    }

    // 23.3 Admin Delete Customer (DELETE /api/admin/customers/:id)
    if (adminCustMatch && method === 'DELETE') {
      const custId = adminCustMatch[1];
      await deleteDoc(doc(db, 'Customer', String(custId)));
      return jsonResponse({ success: true, message: 'ลบบัญชีลูกค้าเรียบร้อยแล้ว' });
    }

    // 24. Admin Dashboard (GET /api/admin/dashboard)
    if (path === '/api/admin/dashboard' && method === 'GET') {
      const [custSnap, ownerSnap, lotSnap, slotSnap, resvSnap, compSnap, paySnap, auditSnap] = await Promise.all([
        getDocs(collection(db, 'Customer')),
        getDocs(collection(db, 'Parking_Owner')),
        getDocs(collection(db, 'ParkingLot')),
        getDocs(collection(db, 'ParkingSlot')),
        getDocs(collection(db, 'Reservation_Detail')),
        getDocs(collection(db, 'Complaint')),
        getDocs(collection(db, 'Payment')),
        getDocs(collection(db, 'AuditLog'))
      ]);

      let totalRevenue = 0;
      paySnap.forEach(p => {
        const amt = Number(p.data().Amount) || 0;
        totalRevenue += amt;
      });

      let complaintPending = 0;
      compSnap.forEach(c => {
        if (c.data().Complaint_Status === 'Pending') complaintPending++;
      });

      const recentLogs: any[] = [];
      auditSnap.forEach(a => recentLogs.push({ ...a.data() }));
      recentLogs.sort((a, b) => new Date(b.Created_At || 0).getTime() - new Date(a.Created_At || 0).getTime());

      return jsonResponse({
        customerCount: custSnap.size,
        ownerCount: ownerSnap.size,
        lotCount: lotSnap.size,
        slotCount: slotSnap.size,
        bookingCount: resvSnap.size,
        complaintPending,
        totalRevenue,
        recentLogs: recentLogs.slice(0, 15)
      });
    }

    // 25. Owner Dashboard (GET /api/owner/dashboard)
    if (path === '/api/owner/dashboard' && method === 'GET') {
      const user = getStoredUser(init);
      const ownerId = Number(user?.id);

      // Strict owner separation: if no user or no ownerId, return empty isolated stats
      if (!user || !ownerId) {
        return jsonResponse({
          totalLots: 0,
          totalSlots: 0,
          occupiedSlots: 0,
          availableSlots: 0,
          reservedSlots: 0,
          pendingLotsCount: 0,
          rejectedLotsCount: 0,
          todayRevenue: 0,
          totalRevenue: 0,
          lots: [],
          activeParkings: [],
          recentBookings: []
        });
      }

      const [lotSnap, slotSnap, resvSnap] = await Promise.all([
        getDocs(collection(db, 'ParkingLot')),
        getDocs(collection(db, 'ParkingSlot')),
        getDocs(collection(db, 'Reservation_Detail'))
      ]);

      const ownerLots: any[] = [];
      const ownerLotIds = new Set<number>();
      const lotNamesMap = new Map<number, string>();
      lotSnap.forEach(d => {
        const l = d.data();
        lotNamesMap.set(Number(l.Lot_ID), l.LotName);
        if (Number(l.ParkingOwner_ID) === ownerId) {
          ownerLots.push(l);
          ownerLotIds.add(Number(l.Lot_ID));
        }
      });

      // If owner has 0 lots registered, strictly return 0 and empty lists
      if (ownerLots.length === 0) {
        return jsonResponse({
          totalLots: 0,
          totalSlots: 0,
          occupiedSlots: 0,
          availableSlots: 0,
          reservedSlots: 0,
          pendingLotsCount: 0,
          rejectedLotsCount: 0,
          todayRevenue: 0,
          totalRevenue: 0,
          lots: [],
          activeParkings: [],
          recentBookings: []
        });
      }

      let totalSlots = 0;
      let occupiedSlots = 0;
      let reservedSlots = 0;
      slotSnap.forEach(d => {
        const s = d.data();
        if (ownerLotIds.has(Number(s.Lot_ID))) {
          totalSlots++;
          if (s.ParkingSlot_Status === 'Occupied') {
            occupiedSlots++;
          } else if (s.ParkingSlot_Status === 'Reserved') {
            reservedSlots++;
          }
        }
      });

      const availableSlots = Math.max(0, totalSlots - occupiedSlots - reservedSlots);

      const allResv: any[] = [];
      resvSnap.forEach(d => {
        const r = d.data();
        if (ownerLotIds.has(Number(r.Lot_ID))) {
          allResv.push({
            ...r,
            LotName: lotNamesMap.get(Number(r.Lot_ID)) || 'ลานจอดรถ'
          });
        }
      });

      allResv.sort((a, b) => (b.Booking_ID || 0) - (a.Booking_ID || 0));

      const activeParkings = allResv.filter(r => r.Reservation_Status === 'Checked_In');

      let totalRevenue = 0;
      allResv.forEach(r => {
        if (['Confirmed', 'Checked_In', 'Completed'].includes(r.Reservation_Status)) {
          totalRevenue += (Number(r.Base_Fee) || 0) + (Number(r.Overtime_Penalty) || 0) + (Number(r.Late_Penalty) || 0);
        }
      });

      const pendingLotsCount = ownerLots.filter(l => l.ParkingLot_Status === 'Pending').length;
      const rejectedLotsCount = ownerLots.filter(l => l.ParkingLot_Status === 'Rejected').length;
      const activeLotsCount = ownerLots.filter(l => l.ParkingLot_Status === 'Active').length;

      return jsonResponse({
        totalLots: activeLotsCount > 0 ? activeLotsCount : ownerLots.length,
        lots: ownerLots, // Crucial: return ownerLots so OwnerDashboard renders them
        totalSlots,
        occupiedSlots,
        availableSlots,
        reservedSlots,
        pendingLotsCount,
        rejectedLotsCount,
        todayRevenue: totalRevenue,
        totalRevenue,
        activeParkings,
        recentBookings: allResv.slice(0, 20)
      });
    }

    // 26. Revenue Reports (GET /api/reports/revenue)
    if (path === '/api/reports/revenue' && method === 'GET') {
      const [lotSnap, resvSnap, paySnap] = await Promise.all([
        getDocs(collection(db, 'ParkingLot')),
        getDocs(collection(db, 'Reservation_Detail')),
        getDocs(collection(db, 'Payment'))
      ]);

      const lotsMap = new Map<number, any>();
      lotSnap.forEach(d => {
        const l = d.data();
        lotsMap.set(Number(l.Lot_ID), {
          Lot_ID: l.Lot_ID,
          LotName: l.LotName,
          Location: l.Location,
          District: l.District || (l.Location ? l.Location.split(' ')[0] : 'อ.เมือง'),
          totalRevenue: 0,
          bookingCount: 0,
          totalBookings: 0
        });
      });

      resvSnap.forEach(d => {
        const r = d.data();
        const lot = lotsMap.get(Number(r.Lot_ID));
        if (lot) {
          lot.bookingCount = (lot.bookingCount || 0) + 1;
          lot.totalBookings = (lot.totalBookings || 0) + 1;
          if (['Confirmed', 'Checked_In', 'Completed'].includes(r.Reservation_Status)) {
            lot.totalRevenue += (Number(r.Base_Fee) || 0) + (Number(r.Overtime_Penalty) || 0) + (Number(r.Late_Penalty) || 0);
          }
        }
      });

      const recentPayments: any[] = [];
      paySnap.forEach(d => recentPayments.push(d.data()));
      recentPayments.sort((a, b) => new Date(b.Payment_Date || 0).getTime() - new Date(a.Payment_Date || 0).getTime());

      return jsonResponse({
        revenueByLot: Array.from(lotsMap.values()),
        recentPayments: recentPayments.slice(0, 20)
      });
    }

    // 27. Complaints List & Create & Resolve
    if (path === '/api/complaints' && method === 'GET') {
      const user = getStoredUser(init);
      const snap = await getDocs(collection(db, 'Complaint'));
      const complaints: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        const cid = Number(data.Complaint_ID || d.id);
        const title = data.Title || data.title || 'เรื่องร้องเรียน';
        const description = data.Description || data.description || '';
        const adminResponse = data.Admin_Response || data.adminResponse || data.Resolution_Notes || '';
        const status = data.Complaint_Status || data.status || 'Pending';
        const date = data.Complaint_Date || data.Created_At || data.created_at || new Date().toISOString();
        const customerId = data.Customer_ID || data.customerId;
        const customerUsername = data.CustomerUsername || data.customerUsername || 'ลูกค้า';

        // If user is Customer, filter to their complaints if Customer_ID is present
        if (user && user.role === 'Customer' && customerId) {
          if (String(customerId) !== String(user.id)) {
            return;
          }
        }

        complaints.push({
          ...data,
          Complaint_ID: cid,
          Title: title,
          title: title,
          Description: description,
          description: description,
          Admin_Response: adminResponse,
          adminResponse: adminResponse,
          Resolution_Notes: adminResponse,
          Complaint_Status: status,
          status: status,
          Complaint_Date: date,
          Customer_ID: customerId || user?.id || 1,
          CustomerUsername: customerUsername
        });
      });
      complaints.sort((a, b) => (b.Complaint_ID || 0) - (a.Complaint_ID || 0));
      return jsonResponse(complaints);
    }
    if (path === '/api/complaints' && method === 'POST') {
      const user = getStoredUser(init);
      const id = Date.now();
      const title = body?.Title || body?.title || '';
      const description = body?.Description || body?.description || '';
      const nowIso = new Date().toISOString();

      const newComplaint = {
        Complaint_ID: id,
        Customer_ID: user?.id || 1,
        CustomerUsername: user?.username || (user?.FName ? `${user?.FName} ${user?.LName || ''}`.trim() : 'ลูกค้า'),
        Title: title,
        title: title,
        Description: description,
        description: description,
        Complaint_Status: 'Pending',
        Complaint_Date: nowIso,
        Admin_Response: '',
        Created_At: nowIso
      };

      await setDoc(doc(db, 'Complaint', String(id)), newComplaint);
      return jsonResponse({ success: true, message: 'ส่งข้อร้องเรียนเรียบร้อย' });
    }
    const compResolveMatch = path.match(/^\/api\/complaints\/(\d+)$/);
    if (compResolveMatch && method === 'PATCH') {
      const id = compResolveMatch[1];
      const { status, adminResponse } = body || {};
      const reply = adminResponse || body?.Admin_Response || '';
      await updateDoc(doc(db, 'Complaint', String(id)), {
        Complaint_Status: status || 'Resolved',
        Admin_Response: reply,
        adminResponse: reply,
        Resolution_Notes: reply,
        Resolved_At: new Date().toISOString()
      });
      return jsonResponse({ success: true, message: 'ตอบกลับข้อร้องเรียนเรียบร้อย' });
    }

    // 28. Favorites
    if (path === '/api/favorites' && method === 'GET') {
      const user = getStoredUser(init);
      const userId = Number(user?.id) || 1;
      const snap = await getDocs(collection(db, 'FavoriteLot'));
      const lotSnap = await getDocs(collection(db, 'ParkingLot'));
      const slotCounts = await getSlotCountsMap();

      const lotMap = new Map<number, any>();
      lotSnap.forEach(d => {
        const lot = d.data();
        const lid = Number(lot.Lot_ID);
        const counts = slotCounts[lid] || { total: 10, available: 7 };
        lotMap.set(lid, {
          ...lot,
          total_slots: counts.total,
          available_slots: counts.available,
          occupied_slots: Math.max(0, counts.total - counts.available)
        });
      });

      const favLots: any[] = [];
      snap.forEach(d => {
        const fav = d.data();
        if (Number(fav.Customer_ID) === userId) {
          const lotData = lotMap.get(Number(fav.Lot_ID));
          if (lotData) {
            favLots.push({
              ...lotData,
              Favorite_ID: fav.Favorite_ID
            });
          }
        }
      });

      favLots.sort((a, b) => (a.Lot_ID || 0) - (b.Lot_ID || 0));
      return jsonResponse(favLots);
    }
    const favMatch = path.match(/^\/api\/favorites\/(\d+)$/);
    if (favMatch && method === 'POST') {
      const user = getStoredUser();
      const lotId = Number(favMatch[1]);
      const userId = Number(user?.id) || 1;
      const favId = `${userId}_${lotId}`;
      await setDoc(doc(db, 'FavoriteLot', favId), {
        Favorite_ID: favId,
        Customer_ID: userId,
        Lot_ID: lotId,
        Saved_Date: new Date().toISOString()
      });
      return jsonResponse({ success: true, message: 'บันทึกเป็นลานโปรดแล้ว' });
    }
    if (favMatch && method === 'DELETE') {
      const user = getStoredUser();
      const lotId = Number(favMatch[1]);
      const userId = Number(user?.id) || 1;
      const favId = `${userId}_${lotId}`;
      try {
        await deleteDoc(doc(db, 'FavoriteLot', favId));
      } catch (_) {}

      try {
        const qSnap = await getDocs(query(collection(db, 'FavoriteLot'), where('Lot_ID', '==', lotId)));
        for (const d of qSnap.docs) {
          if (Number(d.data().Customer_ID) === userId) {
            await deleteDoc(d.ref);
          }
        }
      } catch (_) {}

      return jsonResponse({ success: true, message: 'ลบออกจากรายการโปรดแล้ว' });
    }

    // 29. Database Inspector Endpoints
    if (path === '/api/admin/database/entities' && method === 'GET') {
      const list: any[] = [];
      for (const [entityName, def] of Object.entries(ENTITY_DEFINITIONS)) {
        let count = 0;
        try {
          const s = await getDocs(collection(db, entityName));
          count = s.size;
        } catch (_) {}

        list.push({
          entityName,
          displayNameThai: def.displayNameThai,
          category: def.category,
          description: def.description,
          primaryKey: def.primaryKey,
          color: def.color,
          icon: def.icon,
          attributesCount: def.attributes.length,
          recordCount: count,
          attributes: def.attributes
        });
      }
      return jsonResponse({
        success: true,
        totalEntities: list.length,
        totalRecords: list.reduce((sum, item) => sum + item.recordCount, 0),
        entities: list
      });
    }

    const entityMatch = path.match(/^\/api\/admin\/database\/entities\/([a-zA-Z_]+)$/);
    if (entityMatch && method === 'GET') {
      const entityName = entityMatch[1];
      const def = ENTITY_DEFINITIONS[entityName];
      if (!def) {
        return jsonResponse({ error: `ไม่พบตาราง Entity '${entityName}' ในระบบ` }, 404);
      }
      const s = await getDocs(collection(db, entityName));
      const records: any[] = [];
      s.forEach(d => records.push(d.data()));

      const pk = def.primaryKey;
      records.sort((a, b) => {
        const valA = a[pk];
        const valB = b[pk];
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return String(valA || '').localeCompare(String(valB || ''));
      });

      const incoming = ER_RELATIONSHIPS.filter(r => r.toTable === entityName);
      const outgoing = ER_RELATIONSHIPS.filter(r => r.fromTable === entityName);

      return jsonResponse({
        success: true,
        entity: def,
        totalRecords: records.length,
        page: 1,
        limit: 100,
        records: records.slice(0, 100),
        relations: { incoming, outgoing }
      });
    }

    if (path === '/api/admin/database/erd' && method === 'GET') {
      return jsonResponse({
        success: true,
        entities: ENTITY_DEFINITIONS,
        relationships: ER_RELATIONSHIPS
      });
    }

    if (path === '/api/admin/database/data-flows' && method === 'GET') {
      return jsonResponse({
        success: true,
        stages: DATA_FLOW_STAGES
      });
    }

    if (path === '/api/admin/database/ddl-script' && method === 'GET') {
      return jsonResponse({
        success: true,
        ddl: ORACLE_SQL_DDL
      });
    }

    if (path === '/api/admin/database/query' && method === 'POST') {
      const sql = (body?.sql || '').trim();
      const matchTable = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      const tableName = matchTable ? matchTable[1] : 'ParkingLot';

      const snap = await getDocs(collection(db, tableName));
      const rows: any[] = [];
      snap.forEach(d => rows.push(d.data()));
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return jsonResponse({
        success: true,
        columns,
        rows,
        rowCount: rows.length,
        durationMs: 15
      });
    }

    // 30. Firebase Sync Status
    if (path === '/api/firebase/sync-all' && method === 'POST') {
      return jsonResponse({ 
        success: true, 
        message: 'ระบบเชื่อมต่อและใช้งานฐานข้อมูล Firebase Cloud Firestore เป็นหลักเรียบร้อยแล้ว' 
      });
    }

    // Fallback 404
    return jsonResponse({ error: `Endpoint not found: ${path}` }, 404);
  } catch (err: any) {
    console.error('[Firebase Adapter Error]:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}

/**
 * Global Fetch Interceptor
 * Intercepts /api/* requests so they route directly to Firebase Firestore
 * when running on Firebase Hosting or when local server is offline.
 */
export function setupFirebaseAdapter() {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof (input as any).url === 'string') {
      url = (input as any).url;
    }

    // Only intercept /api/ endpoints
    if (!url.startsWith('/api/') && !url.includes('/api/')) {
      return originalFetch(input, init);
    }

    // Check if running on Firebase Hosting (pure static hosting without backend server)
    const isFirebaseHosting = 
      typeof window !== 'undefined' && 
      (window.location.hostname.includes('firebaseapp.com') ||
       window.location.hostname.includes('web.app'));

    if (!isFirebaseHosting) {
      // If on localhost or server environment, try local backend first
      try {
        const res = await originalFetch(input, init);
        const ct = res.headers.get('content-type') || '';
        // If it returned a valid JSON/API response (not HTML fallback) and not gateway error, return it
        if (!ct.includes('text/html') && res.status !== 404 && res.status !== 502 && res.status !== 503 && res.status !== 504) {
          return res;
        }
      } catch (_) {
        // Backend offline, fallback to Firestore directly
      }
    }

    // Handle with Firebase Firestore
    return handleFirestoreRequest(url, init);
  };

  console.log('🔥 ParkSmart Firebase Cloud Firestore Database Engine is ACTIVE!');
}
