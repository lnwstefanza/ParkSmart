const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { db, initDatabase, logAudit } = require('./db');
const { ORACLE_SQL_DDL } = require('./schema-ddl');
const { ENTITY_DEFINITIONS, ER_RELATIONSHIPS, DATA_FLOW_STAGES } = require('./entity-definitions');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'parksmart-secret-key-2026-khonkaen';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static lot images
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));
app.use('/logo.svg', express.static(path.join(__dirname, '../client/public/logo.svg')));

// Initialize DB schema & seed data (Strict SQL Relational Database)
initDatabase();
console.log('✅ ParkSmart SQL Database Online: 11 Entities matching Relational_Diagram.pdf');

const {
  ENTITY_CONFIG,
  syncEntityRecord,
  deleteEntityRecord,
  syncAllDatabaseToFirebase
} = require('./firebase-sync');

function syncRow(tableName, id) {
  try {
    const pk = ENTITY_CONFIG[tableName];
    if (!pk || id === undefined || id === null) return;
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE ${pk} = ?`).get(id);
    if (row) {
      syncEntityRecord(tableName, row);
    }
  } catch (err) {
    console.warn(`[Firebase Sync Error] ${tableName} #${id}:`, err.message);
  }
}


// -------------------------------------------------------------
// JWT Middleware
// -------------------------------------------------------------
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ Token ยืนยันตัวตน' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
    }
    next();
  };
}

function getBangkokNow() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date()).replace(', ', ' ');
}

function formatBangkokDateTime(d) {
  const dateObj = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(dateObj).replace(', ', ' ');
}

function parseDateSafeServer(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  let s = String(dateInput).trim();
  if (!s) return null;
  if (s.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  s = s.replace(' ', 'T');
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  d = new Date(s + '+07:00');
  if (!isNaN(d.getTime())) return d;
  return null;
}

function formatThaiDateTimeServer(dateInput) {
  if (!dateInput) return '-';
  const d = parseDateSafeServer(dateInput);
  if (!d) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} เวลา ${hours}:${minutes} น.`;
}


// -------------------------------------------------------------
// 1. Authentication Endpoints (/api/auth)
// -------------------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  const { role, username, password, fname, lname, phone, email, bankAccount } = req.body;
  if (!username || !password || !fname || !lname) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    if (role === 'Owner') {
      const stmt = db.prepare(`
        INSERT INTO Parking_Owner (Username, Password_Hash, FName, LName, Phone_Number, Email, Bank_Account, Created_By, Updated_By)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(username, hash, fname, lname, phone || '', email || '', bankAccount || '', username, username);
      const newOwnerId = Number(result.lastInsertRowid);
      syncRow('Parking_Owner', newOwnerId);
      logAudit('REGISTER', 'Parking_Owner', newOwnerId, username, 'Owner registered');
      return res.json({ success: true, message: 'ลงทะเบียนเจ้าของลานสำเร็จ' });
    } else {
      const stmt = db.prepare(`
        INSERT INTO Customer (Username, Password_Hash, FName, LName, Phone_Number, Email, Created_By, Updated_By)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(username, hash, fname, lname, phone || '', email || '', username, username);
      const newCustomerId = Number(result.lastInsertRowid);
      syncRow('Customer', newCustomerId);
      logAudit('REGISTER', 'Customer', newCustomerId, username, 'Customer registered');
      return res.json({ success: true, message: 'สมัครสมาชิกลูกค้าสำเร็จ' });
    }
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
    }
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณาระบุ Username และ Password' });
  }

  // 1. Administrator
  let user = db.prepare('SELECT * FROM Administrator WHERE Username = ?').get(username);
  let role = 'Admin';
  let userIdField = 'Admin_ID';

  // 2. Parking_Owner
  if (!user) {
    user = db.prepare('SELECT * FROM Parking_Owner WHERE Username = ?').get(username);
    role = 'Owner';
    userIdField = 'ParkingOwner_ID';
  }

  // 3. Customer
  if (!user) {
    user = db.prepare('SELECT * FROM Customer WHERE Username = ?').get(username);
    role = 'Customer';
    userIdField = 'Customer_ID';
  }

  if (!user) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  if (user.Account_Status && user.Account_Status !== 'Active') {
    return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
  }

  const valid = bcrypt.compareSync(password, user.Password_Hash);
  if (!valid) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  const userId = user[userIdField];
  const payload = {
    id: userId,
    username: user.Username,
    role: role,
    fname: user.FName,
    lname: user.LName,
    email: user.Email
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  logAudit('LOGIN', role, userId, user.Username, 'User logged in successfully');

  res.json({
    token,
    user: payload
  });
});

// Sync All SQLite Entities to Firebase on Demand
app.post('/api/firebase/sync-all', async (req, res) => {
  try {
    const summary = await syncAllDatabaseToFirebase(db);
    res.json({ success: true, message: 'ซิงค์ข้อมูลทุก Entity ไปยัง Firebase สำเร็จ', summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// -------------------------------------------------------------
// 2. Parking Lots & Slots Endpoints (/api/lots)
// -------------------------------------------------------------

app.get('/api/lots', (req, res) => {
  const { search, district, status, ownerId } = req.query;
  let sql = `
    SELECT 
      l.*,
      o.FName AS OwnerFName,
      o.LName AS OwnerLName,
      o.Username AS OwnerUsername,
      COUNT(s.Slot_ID) AS total_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots
    FROM ParkingLot l
    LEFT JOIN Parking_Owner o ON l.ParkingOwner_ID = o.ParkingOwner_ID
    LEFT JOIN ParkingSlot s ON l.Lot_ID = s.Lot_ID
    WHERE 1=1
  `;
  const params = [];

  if (ownerId) {
    sql += ` AND l.ParkingOwner_ID = ?`;
    params.push(ownerId);
  }

  if (status && status !== 'all') {
    sql += ` AND l.ParkingLot_Status = ?`;
    params.push(status);
  } else if (status === 'all' || ownerId) {
    // When requesting all or filtering by owner, do not restrict status to Active
  } else {
    sql += ` AND l.ParkingLot_Status = 'Active'`;
  }

  if (district) {
    sql += ` AND l.District LIKE ?`;
    params.push(`%${district}%`);
  }

  if (search) {
    sql += ` AND (l.LotName LIKE ? OR l.Location LIKE ? OR l.Description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` GROUP BY l.Lot_ID ORDER BY l.Is_Recommended DESC, l.Recommended_Order ASC, l.Lot_ID ASC`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.get('/api/lots/recommended', (req, res) => {
  const sql = `
    SELECT 
      l.*,
      COUNT(s.Slot_ID) AS total_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Available' THEN 1 ELSE 0 END) AS available_slots
    FROM ParkingLot l
    LEFT JOIN ParkingSlot s ON l.Lot_ID = s.Lot_ID
    WHERE l.ParkingLot_Status = 'Active' AND l.Is_Recommended = 1
    GROUP BY l.Lot_ID
    ORDER BY l.Recommended_Order ASC
  `;
  const rows = db.prepare(sql).all();
  res.json(rows);
});

app.get('/api/lots/:id', (req, res) => {
  const lot = db.prepare(`
    SELECT 
      l.*,
      COUNT(s.Slot_ID) AS total_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots,
      SUM(CASE WHEN s.ParkingSlot_Status = 'Reserved' THEN 1 ELSE 0 END) AS reserved_slots
    FROM ParkingLot l
    LEFT JOIN ParkingSlot s ON l.Lot_ID = s.Lot_ID
    WHERE l.Lot_ID = ?
    GROUP BY l.Lot_ID
  `).get(req.params.id);

  if (!lot) {
    return res.status(404).json({ error: 'ไม่พบลานจอดรถนี้' });
  }
  res.json(lot);
});

app.get('/api/lots/:id/slots', (req, res) => {
  const lotId = req.params.id;
  const { date, time, duration } = req.query;

  const nowBangkok = getBangkokNow();
  const queryDate = date || nowBangkok.substring(0, 10);
  const queryTime = time || nowBangkok.substring(11, 16);
  const durHours = Math.max(1, Number(duration) || 2);

  const queryStart = `${queryDate} ${queryTime}:00`;
  const startDate = new Date(queryStart.replace(' ', 'T') + '+07:00');
  const endDate = new Date(startDate.getTime() + (durHours * 3600000));
  const queryEnd = formatBangkokDateTime(endDate);

  const slots = db.prepare(`
    SELECT * FROM ParkingSlot
    WHERE Lot_ID = ?
    ORDER BY Floor ASC, Zone ASC, SpaceCode ASC
  `).all(lotId);

  // Check active overlapping reservations for this lot during [queryStart, queryEnd]
  const activeReservations = db.prepare(`
    SELECT d.Slot_ID, d.Reservation_Status, d.Expected_Arrival, d.Booked_End
    FROM Reservation_Detail d
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    WHERE s.Lot_ID = ?
      AND d.Reservation_Status IN ('Confirmed', 'Checked_In')
      AND datetime(d.Expected_Arrival) < datetime(?)
      AND datetime(d.Booked_End) > datetime(?)
  `).all(lotId, queryEnd, queryStart);

  const resMap = new Map();
  for (const r of activeReservations) {
    const existing = resMap.get(r.Slot_ID);
    if (!existing || r.Reservation_Status === 'Checked_In') {
      resMap.set(r.Slot_ID, r);
    }
  }

  const result = slots.map(s => {
    if (s.ParkingSlot_Status === 'Maintenance') {
      return s;
    }
    const active = resMap.get(s.Slot_ID);
    if (active) {
      return {
        ...s,
        ParkingSlot_Status: active.Reservation_Status === 'Checked_In' ? 'Occupied' : 'Reserved',
        ActiveBooking: {
          expectedArrival: active.Expected_Arrival,
          bookedEnd: active.Booked_End
        }
      };
    }
    return {
      ...s,
      ParkingSlot_Status: 'Available'
    };
  });

  res.json(result);
});

// Check availability for a specific slot on requested date and time
app.get('/api/slots/:id/check-availability', (req, res) => {
  const slotId = req.params.id;
  const { date, time, duration } = req.query;

  const nowBangkok = getBangkokNow();
  const queryDate = date || nowBangkok.substring(0, 10);
  const queryTime = time || nowBangkok.substring(11, 16);
  const durHours = Math.max(1, Number(duration) || 2);

  const queryStart = `${queryDate} ${queryTime}:00`;
  const startDate = new Date(queryStart.replace(' ', 'T') + '+07:00');
  const endDate = new Date(startDate.getTime() + (durHours * 3600000));
  const queryEnd = formatBangkokDateTime(endDate);

  const slot = db.prepare(`
    SELECT s.*, l.LotName, l.OpenTime, l.CloseTime
    FROM ParkingSlot s
    JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
    WHERE s.Slot_ID = ?
  `).get(slotId);

  if (!slot) {
    return res.status(404).json({ available: false, message: 'ไม่พบช่องจอดที่ระบุ' });
  }

  if (slot.ParkingSlot_Status === 'Maintenance') {
    return res.json({ available: false, message: 'ช่องจอดนี้ปิดปรับปรุงชั่วคราว' });
  }

  // Check Operating Hours
  if (slot.OpenTime && slot.CloseTime) {
    const [openH, openM] = slot.OpenTime.split(':').map(Number);
    const [closeH, closeM] = slot.CloseTime.split(':').map(Number);
    const [startH, startM] = queryTime.split(':').map(Number);

    const startTotalMin = startH * 60 + (startM || 0);
    const openTotalMin = openH * 60 + (openM || 0);
    const closeTotalMin = closeH * 60 + (closeM || 0);
    const endTotalMin = startTotalMin + durHours * 60;

    if (startTotalMin < openTotalMin || startTotalMin >= closeTotalMin) {
      return res.json({ 
        available: false, 
        message: `เวลาที่เลือกอยู่นอกเวลาทำการของลานจอด (เปิด ${slot.OpenTime} น. - ปิด ${slot.CloseTime} น.)` 
      });
    }

    if (endTotalMin > closeTotalMin) {
      const maxH = Math.max(0, Math.floor((closeTotalMin - startTotalMin) / 60));
      return res.json({ 
        available: false, 
        message: `ไม่สามารถจองเกินเวลาปิดลานจอดได้ (ปิดเวลา ${slot.CloseTime} น.) จองเวลา ${queryTime} น. สามารถจองได้สูงสุด ${maxH} ชั่วโมง` 
      });
    }
  }

  // Check Overlapping Reservation
  const conflicting = db.prepare(`
    SELECT r.Booking_ID, d.Expected_Arrival, d.Booked_End, d.Reservation_Status
    FROM Reservation_Detail d
    JOIN Reservation r ON d.Booking_ID = r.Booking_ID
    WHERE d.Slot_ID = ?
      AND d.Reservation_Status IN ('Pending_Payment', 'Confirmed', 'Checked_In')
      AND datetime(d.Expected_Arrival) < datetime(?)
      AND datetime(d.Booked_End) > datetime(?)
  `).get(slotId, queryEnd, queryStart);

  if (conflicting) {
    const cStart = formatThaiDateTimeServer(conflicting.Expected_Arrival);
    const cEnd = formatThaiDateTimeServer(conflicting.Booked_End);
    return res.json({
      available: false,
      message: `ช่องจอดนี้มีการจองไว้แล้วในช่วงเวลา ${cStart} ถึง ${cEnd}`
    });
  }

  return res.json({ available: true });
});


// Owner adds lot (assigned to logged-in owner)
app.post('/api/owner/lots', authenticate, requireRole('Owner', 'Admin'), (req, res) => {
  const {
    lotName, location, district, openTime, closeTime,
    feeRatePerHour, dailyMaxFee, description, imageUrl
  } = req.body;

  const ownerId = req.user.role === 'Owner' ? req.user.id : (req.body.ownerId || req.user.id);
  const initialStatus = req.user.role === 'Admin' ? 'Active' : 'Pending';

  const stmt = db.prepare(`
    INSERT INTO ParkingLot (
      ParkingOwner_ID, LotName, Location, District, OpenTime, CloseTime,
      FeeRate, FeeRate_Per_Hour, Free_Minutes, Billing_Unit_Min, Daily_Max_Fee,
      Deposit_Amount, ParkingLot_Status, Image_Url, Description, Created_By, Updated_By
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 60, ?, 20, ?, ?, ?, ?, ?)
  `);

  const rate = Number(feeRatePerHour) || 20;
  const result = stmt.run(
    ownerId, lotName, location, district || 'อ.เมืองขอนแก่น',
    openTime || '10:00', closeTime || '22:00',
    rate, rate,
    Number(dailyMaxFee) || 200,
    initialStatus,
    imageUrl || '/images/lots/central-khonkaen.jpg', description || '',
    req.user.username || 'Owner', req.user.username || 'Owner'
  );

  const newLotId = Number(result.lastInsertRowid);

  const insertSlot = db.prepare(`
    INSERT INTO ParkingSlot (Lot_ID, SpaceCode, Floor, Zone, ParkingSlot_Status, Created_By, Updated_By)
    VALUES (?, ?, ?, ?, 'Available', ?, ?)
  `);
  for (let i = 1; i <= 20; i++) {
    insertSlot.run(newLotId, `A-${String(i).padStart(2, '0')}`, 'G', 'Zone A', req.user.username || 'Owner', req.user.username || 'Owner');
  }

  syncRow('ParkingLot', newLotId);
  try {
    const slots = db.prepare('SELECT * FROM ParkingSlot WHERE Lot_ID = ?').all(newLotId);
    slots.forEach(s => syncEntityRecord('ParkingSlot', s));
  } catch (_) {}

  logAudit('CREATE_LOT', req.user.role, req.user.id, req.user.username, `Created lot ID ${newLotId}: ${lotName} (Status: ${initialStatus})`);
  res.json({ 
    success: true, 
    lotId: newLotId,
    status: initialStatus,
    message: initialStatus === 'Pending'
      ? 'ส่งคำขอเพิ่มลานจอดรถเรียบร้อยแล้ว สถานะ: รอการอนุมัติจาก Admin'
      : 'สร้างลานจอดรถเรียบร้อยแล้ว'
  });
});

app.put('/api/owner/lots/:id', authenticate, requireRole('Owner', 'Admin'), (req, res) => {
  const { lotName, location, openTime, closeTime, feeRatePerHour, dailyMaxFee, description, imageUrl } = req.body;
  
  if (req.user.role === 'Owner') {
    const lot = db.prepare('SELECT ParkingOwner_ID FROM ParkingLot WHERE Lot_ID = ?').get(req.params.id);
    if (!lot) return res.status(404).json({ error: 'ไม่พบลานจอดนี้' });
    if (lot.ParkingOwner_ID !== req.user.id) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลลานจอดนี้' });
    }
  }

  const rate = Number(feeRatePerHour) || 20;
  db.prepare(`
    UPDATE ParkingLot
    SET LotName = ?, Location = ?, OpenTime = ?, CloseTime = ?,
        FeeRate = ?, FeeRate_Per_Hour = ?, Free_Minutes = 0, Daily_Max_Fee = ?,
        Description = ?, Image_Url = COALESCE(?, Image_Url),
        Updated_At = datetime('now', '+7 hours'), Updated_By = ?
    WHERE Lot_ID = ?
  `).run(
    lotName, location, openTime, closeTime,
    rate, rate, dailyMaxFee,
    description, imageUrl, req.user.username || 'Owner', req.params.id
  );

  syncRow('ParkingLot', req.params.id);
  res.json({ success: true, message: 'แก้ไขข้อมูลลานจอดเรียบร้อย' });
});

app.patch('/api/owner/slots/:id', authenticate, requireRole('Owner', 'Admin'), (req, res) => {
  const { status } = req.body;

  if (req.user.role === 'Owner') {
    const slot = db.prepare(`
      SELECT s.Slot_ID, l.ParkingOwner_ID
      FROM ParkingSlot s
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE s.Slot_ID = ?
    `).get(req.params.id);
    if (!slot) return res.status(404).json({ error: 'ไม่พบช่องจอดนี้' });
    if (slot.ParkingOwner_ID !== req.user.id) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขสถานะช่องจอดของลานนี้' });
    }
  }

  db.prepare(`
    UPDATE ParkingSlot
    SET ParkingSlot_Status = ?, Updated_At = datetime('now', '+7 hours')
    WHERE Slot_ID = ?
  `).run(status, req.params.id);

  syncRow('ParkingSlot', req.params.id);
  res.json({ success: true, message: 'ปรับสถานะช่องจอดสำเร็จ' });
});

app.post('/api/owner/slots', authenticate, requireRole('Owner', 'Admin'), (req, res) => {
  const { lotId, spaceCode, floor, zone } = req.body;

  if (req.user.role === 'Owner') {
    const lot = db.prepare('SELECT ParkingOwner_ID FROM ParkingLot WHERE Lot_ID = ?').get(lotId);
    if (!lot) return res.status(404).json({ error: 'ไม่พบลานจอดนี้' });
    if (lot.ParkingOwner_ID !== req.user.id) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เพิ่มช่องจอดในลานนี้' });
    }
  }

  const result = db.prepare(`
    INSERT INTO ParkingSlot (Lot_ID, SpaceCode, Floor, Zone, ParkingSlot_Status)
    VALUES (?, ?, ?, ?, 'Available')
  `).run(lotId, spaceCode, floor, zone || 'General');

  const newSlotId = Number(result.lastInsertRowid);
  syncRow('ParkingSlot', newSlotId);
  res.json({ success: true, slotId: newSlotId });
});

app.patch('/api/admin/lots/:id/approve', authenticate, requireRole('Admin'), (req, res) => {
  const { status } = req.body;
  const lotId = Number(req.params.id);

  const lot = db.prepare('SELECT * FROM ParkingLot WHERE Lot_ID = ?').get(lotId);
  if (!lot) {
    return res.status(404).json({ error: 'ไม่พบลานจอดนี้' });
  }

  db.prepare(`
    UPDATE ParkingLot
    SET ParkingLot_Status = ?, Updated_At = datetime('now', '+7 hours')
    WHERE Lot_ID = ?
  `).run(status, lotId);

  syncRow('ParkingLot', lotId);
  logAudit('UPDATE_LOT_STATUS', 'Admin', req.user.id, req.user.username, `Updated Lot #${lotId} (${lot.LotName}) status to ${status}`);
  res.json({ success: true, message: `อัปเดตสถานะลานจอดเป็น ${status} สำเร็จ` });
});

app.delete('/api/admin/lots/:id', authenticate, requireRole('Admin'), (req, res) => {
  const lotId = Number(req.params.id);
  const lot = db.prepare('SELECT * FROM ParkingLot WHERE Lot_ID = ?').get(lotId);
  if (!lot) {
    return res.status(404).json({ error: 'ไม่พบลานจอดนี้' });
  }

  // Check if there are active bookings
  const activeBookings = db.prepare(`
    SELECT COUNT(*) as count
    FROM Reservation_Detail d
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    WHERE s.Lot_ID = ? AND d.Reservation_Status IN ('Pending_Payment', 'Confirmed', 'Checked_In')
  `).get(lotId);

  if (activeBookings && activeBookings.count > 0) {
    return res.status(400).json({ 
      error: `ไม่สามารถลบลานจอดนี้ได้ เนื่องจากมีรายการจองที่ยังไม่เสร็จสิ้น ${activeBookings.count} รายการ` 
    });
  }

  try {
    db.exec('BEGIN TRANSACTION;');

    // Find and delete all slots
    const slots = db.prepare('SELECT Slot_ID FROM ParkingSlot WHERE Lot_ID = ?').all(lotId);
    for (const slot of slots) {
      deleteEntityRecord('ParkingSlot', slot.Slot_ID);
    }
    db.prepare('DELETE FROM ParkingSlot WHERE Lot_ID = ?').run(lotId);

    // Delete FavoriteLot
    db.prepare('DELETE FROM FavoriteLot WHERE Lot_ID = ?').run(lotId);

    // Delete ParkingLot
    db.prepare('DELETE FROM ParkingLot WHERE Lot_ID = ?').run(lotId);
    deleteEntityRecord('ParkingLot', lotId);

    db.exec('COMMIT;');

    logAudit('DELETE_LOT', 'Admin', req.user.id, req.user.username, `Deleted parking lot #${lotId}: ${lot.LotName}`);
    res.json({ success: true, message: `ลบลานจอดรถ "${lot.LotName}" เรียบร้อยแล้ว` });
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Delete lot error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบลานจอด: ' + err.message });
  }
});

app.patch('/api/admin/lots/:id/recommend', authenticate, requireRole('Admin'), (req, res) => {
  const { isRecommended, order } = req.body;
  db.prepare(`
    UPDATE ParkingLot
    SET Is_Recommended = ?, Recommended_Order = ?, Updated_At = datetime('now', '+7 hours')
    WHERE Lot_ID = ?
  `).run(isRecommended ? 1 : 0, order || 0, req.params.id);

  syncRow('ParkingLot', req.params.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 3. Reservations & Tickets Endpoints (/api/reservations)
// -------------------------------------------------------------

// Create booking: user selects date, start time, and duration
app.post('/api/reservations', authenticate, (req, res) => {
  const { slotId, licensePlate, bookingDate, startTime, durationHours } = req.body;
  const customerId = req.user.id;

  if (!slotId || !licensePlate || !startTime) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลช่องจอด ป้ายทะเบียน วันที่ และเวลาที่จะเข้าจอด' });
  }

  const duration = Math.max(1, Number(durationHours) || 2);
  const dateStr = bookingDate || getBangkokNow().substring(0, 10);
  const expectedArrival = `${dateStr} ${startTime}:00`;

  // Calculate bookedEnd (expectedArrival + duration hours in Bangkok time)
  const arrivalDate = new Date(expectedArrival.replace(' ', 'T') + '+07:00');
  const endDate = new Date(arrivalDate.getTime() + (duration * 3600000));
  const bookedEnd = formatBangkokDateTime(endDate);

  // Hold slot for at least 30 mins from arrival, or at least 30 mins from current time
  const holdDate = new Date(Math.max(arrivalDate.getTime() + 1800000, Date.now() + 1800000));
  const holdUntil = formatBangkokDateTime(holdDate);

  // Concurrency Lock & Atomic Transaction
  try {
    db.exec('BEGIN TRANSACTION;');

    // 1. Verify Slot exists and get Lot info
    const slot = db.prepare(`
      SELECT s.*, l.FeeRate_Per_Hour, l.LotName, l.OpenTime, l.CloseTime
      FROM ParkingSlot s
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE s.Slot_ID = ?
    `).get(slotId);

    if (!slot) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'ไม่พบช่องจอดที่ระบุ' });
    }

    if (slot.ParkingSlot_Status === 'Maintenance') {
      db.exec('ROLLBACK;');
      return res.status(409).json({ error: 'ขออภัย ช่องจอดนี้ปิดปรับปรุงชั่วคราว กรุณาเลือกช่องอื่น' });
    }

    // 2. Validate Operating Hours & Closing Time
    if (slot.OpenTime && slot.CloseTime) {
      const [openH, openM] = slot.OpenTime.split(':').map(Number);
      const [closeH, closeM] = slot.CloseTime.split(':').map(Number);
      const [startH, startM] = startTime.split(':').map(Number);

      const startTotalMin = startH * 60 + (startM || 0);
      const openTotalMin = openH * 60 + (openM || 0);
      const closeTotalMin = closeH * 60 + (closeM || 0);
      const endTotalMin = startTotalMin + duration * 60;

      if (startTotalMin < openTotalMin || startTotalMin >= closeTotalMin) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ 
          error: `เวลาที่เลือกอยู่นอกเวลาทำการของลานจอด (ลานจอดเปิด ${slot.OpenTime} น. ถึง ${slot.CloseTime} น.)` 
        });
      }

      if (endTotalMin > closeTotalMin) {
        const maxH = Math.max(0, Math.floor((closeTotalMin - startTotalMin) / 60));
        db.exec('ROLLBACK;');
        return res.status(400).json({ 
          error: `ไม่สามารถจองเกินเวลาปิดของลานจอดได้ (${slot.LotName} ปิดเวลา ${slot.CloseTime} น.) จองเวลา ${startTime} น. สามารถจองได้สูงสุด ${maxH} ชั่วโมง` 
        });
      }
    }

    // 3. Check Overlapping Reservation in time interval [expectedArrival, bookedEnd]
    const conflicting = db.prepare(`
      SELECT r.Booking_ID, d.Expected_Arrival, d.Booked_End, d.Reservation_Status
      FROM Reservation_Detail d
      JOIN Reservation r ON d.Booking_ID = r.Booking_ID
      WHERE d.Slot_ID = ?
        AND d.Reservation_Status IN ('Confirmed', 'Checked_In')
        AND datetime(d.Expected_Arrival) < datetime(?)
        AND datetime(d.Booked_End) > datetime(?)
    `).get(slotId, bookedEnd, expectedArrival);

    if (conflicting) {
      db.exec('ROLLBACK;');
      const cStart = formatThaiDateTimeServer(conflicting.Expected_Arrival);
      const cEnd = formatThaiDateTimeServer(conflicting.Booked_End);
      return res.status(409).json({ 
        error: `ขออภัย ช่องจอดนี้มีการจองในช่วงเวลาดังกล่าวแล้ว (${cStart} ถึง ${cEnd}) กรุณาเลือกช่วงเวลาอื่นหรือเลือกช่องจอดอื่น` 
      });
    }

    // Calculate upfront parking fee
    const baseFee = (slot.FeeRate_Per_Hour || 20) * duration;
    const qrToken = 'PS-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();

    // Create Reservation
    const resStmt = db.prepare(`
      INSERT INTO Reservation (Customer_ID, ReserveDate, Created_By, Updated_By)
      VALUES (?, datetime('now', '+7 hours'), ?, ?)
    `);
    const bookingRes = resStmt.run(customerId, req.user.username || 'Customer', req.user.username || 'Customer');
    const bookingId = Number(bookingRes.lastInsertRowid);

    // Create Reservation_Detail with StartTime, EndTime, Booked_Hours, Booked_End, Base_Fee
    const detailStmt = db.prepare(`
      INSERT INTO Reservation_Detail (
        Booking_ID, Slot_ID, LicensePlate, StartTime, EndTime,
        Expected_Arrival, Hold_Until,
        Booked_Hours, Booked_End, Base_Fee, Late_Penalty, Overtime_Penalty,
        Deposit_Amount, Totalfee, Reservation_Status, QRToken, Created_By, Updated_By
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'Pending_Payment', ?, ?, ?)
    `);
    detailStmt.run(
      bookingId, slotId, licensePlate, expectedArrival, bookedEnd,
      expectedArrival, holdUntil, duration, bookedEnd,
      baseFee, baseFee, baseFee, qrToken,
      req.user.username || 'Customer', req.user.username || 'Customer'
    );

    // Slot remains 'Available' while payment is pending. It only becomes 'Reserved' once payment is confirmed.
    db.exec('COMMIT;');

    syncRow('Reservation', bookingId);
    const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(bookingId);
    if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
    syncRow('ParkingSlot', slotId);

    logAudit('CREATE_BOOKING', req.user.role, customerId, req.user.username, `Booking ID ${bookingId} on Slot ${slot.SpaceCode} for ${duration} hrs (Fee: ฿${baseFee})`);

    res.json({
      success: true,
      bookingId,
      slotCode: slot.SpaceCode,
      lotName: slot.LotName,
      baseFee,
      durationHours: duration,
      expectedArrival,
      bookedEnd,
      qrToken
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Reservation error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการทำรายการจอง: ' + err.message });
  }
});

// Customer's reservations
app.get('/api/reservations/my', authenticate, (req, res) => {
  const sql = `
    SELECT 
      r.Booking_ID,
      r.ReserveDate,
      d.Detail_ID,
      d.Slot_ID,
      d.LicensePlate,
      d.Expected_Arrival,
      d.Hold_Until,
      d.Booked_Hours,
      d.Booked_End,
      d.Base_Fee,
      d.Late_Penalty,
      d.Overtime_Penalty,
      d.Deposit_Amount,
      d.Parked_Minutes,
      d.Totalfee,
      d.Reservation_Status,
      d.QRToken,
      s.SpaceCode,
      s.Floor,
      s.Zone,
      l.Lot_ID,
      l.LotName,
      l.Location,
      l.FeeRate_Per_Hour,
      l.Daily_Max_Fee,
      u.Actual_Check_In,
      u.Actual_Check_Out
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
    LEFT JOIN UsageLog u ON r.Booking_ID = u.Booking_ID
    WHERE r.Customer_ID = ?
    ORDER BY r.Booking_ID DESC
  `;
  const rows = db.prepare(sql).all(req.user.id);
  res.json(rows);
});

// Single reservation details & E-Ticket
app.get('/api/reservations/:id', authenticate, async (req, res) => {
  const sql = `
    SELECT 
      r.Booking_ID,
      r.Customer_ID,
      r.ReserveDate,
      d.Detail_ID,
      d.Slot_ID,
      d.LicensePlate,
      d.Expected_Arrival,
      d.Hold_Until,
      d.Booked_Hours,
      d.Booked_End,
      d.Base_Fee,
      d.Late_Penalty,
      d.Overtime_Penalty,
      d.Deposit_Amount,
      d.Parked_Minutes,
      d.Totalfee,
      d.Reservation_Status,
      d.QRToken,
      s.SpaceCode,
      s.Floor,
      s.Zone,
      l.Lot_ID,
      l.LotName,
      l.ParkingOwner_ID,
      l.Location,
      l.District,
      l.FeeRate_Per_Hour,
      l.Daily_Max_Fee,
      l.CloseTime,
      c.FName,
      c.LName,
      c.Phone_Number,
      u.Actual_Check_In,
      u.Actual_Check_Out
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
    JOIN Customer c ON r.Customer_ID = c.Customer_ID
    LEFT JOIN UsageLog u ON r.Booking_ID = u.Booking_ID
    WHERE r.Booking_ID = ?
  `;
  const booking = db.prepare(sql).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจองนี้' });
  }

  if (req.user.role === 'Customer' && booking.Customer_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงตั๋วนี้' });
  }

  if (req.user.role === 'Owner' && booking.ParkingOwner_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงตั๋วของลานจอดนี้' });
  }

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(booking.QRToken, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0369a1',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR error:', err);
  }

  res.json({
    ...booking,
    qrDataUrl
  });
});

// Pay upfront booking parking fee -> status Confirmed + generate QR Code
app.post('/api/reservations/:id/pay-deposit', authenticate, (req, res) => {
  const booking = db.prepare(`
    SELECT r.*, d.Base_Fee, d.Deposit_Amount, d.Reservation_Status, d.Slot_ID
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    WHERE r.Booking_ID = ?
  `).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  }

  if (req.user.role === 'Customer' && booking.Customer_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ทำรายการนี้' });
  }

  if (booking.Reservation_Status !== 'Pending_Payment') {
    return res.status(400).json({ error: 'สถานะรายการไม่ใช่รอชำระเงิน' });
  }

  const fee = booking.Base_Fee || booking.Deposit_Amount || 20;

  // Record payment
  const payResult = db.prepare(`
    INSERT INTO Payment (Booking_ID, Amount, Payment_Type, Payment_Method, Payment_Status, Created_By, Updated_By)
    VALUES (?, ?, 'Prepaid_Parking_Fee', 'PromptPay', 'Completed', ?, ?)
  `).run(booking.Booking_ID, fee, req.user.username || 'Customer', req.user.username || 'Customer');

  // Update status to Confirmed
  db.prepare(`
    UPDATE Reservation_Detail
    SET Reservation_Status = 'Confirmed', Updated_At = datetime('now', '+7 hours')
    WHERE Booking_ID = ?
  `).run(booking.Booking_ID);

  // Update physical slot status to 'Reserved' upon confirmed payment
  if (booking.Slot_ID) {
    db.prepare(`UPDATE ParkingSlot SET ParkingSlot_Status = 'Reserved', Updated_At = datetime('now', '+7 hours') WHERE Slot_ID = ?`).run(booking.Slot_ID);
    syncRow('ParkingSlot', booking.Slot_ID);
  }

  syncRow('Payment', Number(payResult.lastInsertRowid));
  try {
    const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(booking.Booking_ID);
    if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
  } catch (_) {}

  logAudit('PAY_BOOKING_FEE', req.user.role, req.user.id, req.user.username, `Paid parking fee ฿${fee} for Booking ${booking.Booking_ID}`);
  res.json({ success: true, message: 'ชำระค่าจอดรถล่วงหน้าเรียบร้อยแล้ว การจองได้รับการยืนยันและสร้าง QR Code' });
});

// Cancel reservation
app.post('/api/reservations/:id/cancel', authenticate, (req, res) => {
  const booking = db.prepare(`
    SELECT r.*, d.Reservation_Status, d.Slot_ID
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    WHERE r.Booking_ID = ?
  `).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  }

  if (req.user.role === 'Customer' && booking.Customer_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยกเลิกการจองนี้' });
  }

  if (['Checked_In', 'Completed', 'Cancelled', 'Expired'].includes(booking.Reservation_Status)) {
    return res.status(400).json({ error: 'ไม่สามารถยกเลิกรายการในสถานะปัจจุบันได้' });
  }

  db.prepare(`
    UPDATE Reservation_Detail
    SET Reservation_Status = 'Cancelled', Updated_At = datetime('now', '+7 hours')
    WHERE Booking_ID = ?
  `).run(booking.Booking_ID);

  db.prepare(`
    UPDATE ParkingSlot SET ParkingSlot_Status = 'Available' WHERE Slot_ID = ?
  `).run(booking.Slot_ID);

  syncRow('ParkingSlot', booking.Slot_ID);
  try {
    const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(booking.Booking_ID);
    if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
  } catch (_) {}

  logAudit('CANCEL_BOOKING', req.user.role, req.user.id, req.user.username, `Cancelled booking ${booking.Booking_ID}`);
  res.json({ success: true, message: 'ยกเลิกการจองเรียบร้อยแล้ว คืนสถานะช่องจอดแล้ว' });
});

// Pay penalty balance (Final Payment for late check-in or overtime *2)
app.post('/api/reservations/:id/pay-final', authenticate, (req, res) => {
  const booking = db.prepare(`
    SELECT r.*, d.Totalfee, d.Base_Fee, d.Late_Penalty, d.Overtime_Penalty, d.Reservation_Status, d.Slot_ID
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    WHERE r.Booking_ID = ?
  `).get(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  }

  if (req.user.role === 'Customer' && booking.Customer_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ทำรายการนี้' });
  }

  if (booking.Reservation_Status !== 'Awaiting_Final_Payment') {
    return res.status(400).json({ error: 'รายการนี้ไม่ได้อยู่ในสถานะรอชำระส่วนต่าง' });
  }

  const penaltyBalance = (booking.Late_Penalty || 0) + (booking.Overtime_Penalty || 0);

  // Record payment
  const payResult = db.prepare(`
    INSERT INTO Payment (Booking_ID, Amount, Payment_Type, Payment_Method, Payment_Status, Created_By, Updated_By)
    VALUES (?, ?, 'Penalty_Fee', 'PromptPay', 'Completed', ?, ?)
  `).run(booking.Booking_ID, penaltyBalance, req.user.username || 'Customer', req.user.username || 'Customer');

  // Update status to Completed
  db.prepare(`
    UPDATE Reservation_Detail
    SET Reservation_Status = 'Completed', Updated_At = datetime('now', '+7 hours')
    WHERE Booking_ID = ?
  `).run(booking.Booking_ID);

  // Free slot
  db.prepare(`
    UPDATE ParkingSlot SET ParkingSlot_Status = 'Available' WHERE Slot_ID = ?
  `).run(booking.Slot_ID);

  syncRow('Payment', Number(payResult.lastInsertRowid));
  syncRow('ParkingSlot', booking.Slot_ID);
  try {
    const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(booking.Booking_ID);
    if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
  } catch (_) {}

  logAudit('PAY_PENALTY', req.user.role, req.user.id, req.user.username, `Paid penalties ฿${penaltyBalance} for Booking ${booking.Booking_ID}`);
  res.json({ success: true, message: 'ชำระค่าปรับส่วนเกินเรียบร้อย ขอบคุณที่ใช้บริการ ParkSmart' });
});

// -------------------------------------------------------------
// 4. QR Check-in & Check-out Engine (/api/scan)
// -------------------------------------------------------------

// Check-in (with Late Check-in Penalty calculation)
app.post('/api/scan/check-in', authenticate, (req, res) => {
  const { qrToken, bookingId } = req.body;

  let detail;
  if (qrToken) {
    detail = db.prepare(`
      SELECT d.*, s.Lot_ID, l.FeeRate_Per_Hour, l.LotName, l.ParkingOwner_ID
      FROM Reservation_Detail d
      JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE d.QRToken = ?
    `).get(qrToken);
  } else if (bookingId) {
    detail = db.prepare(`
      SELECT d.*, s.Lot_ID, l.FeeRate_Per_Hour, l.LotName, l.ParkingOwner_ID
      FROM Reservation_Detail d
      JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE d.Booking_ID = ?
    `).get(bookingId);
  }

  if (!detail) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลตั๋วการจองจากรหัสนี้' });
  }

  if (req.user.role === 'Owner' && detail.ParkingOwner_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์จัดการตั๋วของลานจอดนี้' });
  }

  if (detail.Reservation_Status === 'Checked_In') {
    return res.status(400).json({ error: 'รถคันนี้ได้ทำการเช็คอินเข้าสู่ลานจอดแล้ว' });
  }

  if (detail.Reservation_Status !== 'Confirmed') {
    return res.status(400).json({ 
      error: `ไม่สามารถเช็คอินได้ สถานะการจองปัจจุบันคือ '${detail.Reservation_Status}' (ต้องเป็น Confirmed ที่ชำระเงินแล้วเท่านั้น)` 
    });
  }

  const nowBangkok = getBangkokNow();

  const inTime = parseDateSafeServer(nowBangkok)?.getTime() || Date.now();
  const expectedTime = parseDateSafeServer(detail.Expected_Arrival)?.getTime() || 0;

  // Validate: User cannot check in before the booked arrival time
  if (inTime < expectedTime) {
    const formattedExpected = formatThaiDateTimeServer(detail.Expected_Arrival);
    return res.status(400).json({ 
      error: `ไม่สามารถเข้าจอดได้เนื่องจากยังไม่ถึงเวลาจอง (เวลาที่คุณจองเข้าจอดคือ: ${formattedExpected})`,
      expectedArrival: detail.Expected_Arrival
    });
  }

  // Calculate Late Check-in Penalty if arrived after Expected_Arrival
  // Grace period: 10 mins. If late > 10 mins, fine 20 THB per 30 mins late.
  let latePenalty = 0;
  let lateMinutes = 0;

  if (inTime > expectedTime) {
    lateMinutes = Math.max(0, Math.ceil((inTime - expectedTime) / 60000));
    if (lateMinutes > 10) {
      latePenalty = Math.ceil(lateMinutes / 30) * 20; // 20 บาท ต่อ 30 นาที
    }
  }

  // Create UsageLog
  const logResult = db.prepare(`
    INSERT INTO UsageLog (Booking_ID, Slot_ID, Actual_Check_In, Created_By, Updated_By)
    VALUES (?, ?, ?, ?, ?)
  `).run(detail.Booking_ID, detail.Slot_ID, nowBangkok, req.user.username || 'System', req.user.username || 'System');

  // Update Reservation_Detail (keep Booked_End calculated from Expected_Arrival + Booked_Hours)
  db.prepare(`
    UPDATE Reservation_Detail
    SET Reservation_Status = 'Checked_In',
        Late_Penalty = ?,
        Totalfee = Base_Fee + ?,
        Updated_At = ?
    WHERE Booking_ID = ?
  `).run(latePenalty, latePenalty, nowBangkok, detail.Booking_ID);

  // Update ParkingSlot to Occupied
  db.prepare(`
    UPDATE ParkingSlot
    SET ParkingSlot_Status = 'Occupied', Updated_At = ?
    WHERE Slot_ID = ?
  `).run(nowBangkok, detail.Slot_ID);

  syncRow('UsageLog', Number(logResult.lastInsertRowid));
  syncRow('ParkingSlot', detail.Slot_ID);
  try {
    const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(detail.Booking_ID);
    if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
  } catch (_) {}

  let message = 'เช็คอินสำเร็จ รถเข้าสู่ลานจอดแล้ว';
  if (latePenalty > 0) {
    message += ` (มาสายกว่าเวลาจอง ${lateMinutes} นาที คิดค่าปรับความล่าช้า ฿${latePenalty})`;
  }

  logAudit('CHECK_IN', req.user.role, req.user.id, req.user.username, `Check-in Booking ${detail.Booking_ID} at ${nowBangkok}, Late Penalty: ฿${latePenalty}`);

  res.json({
    success: true,
    message,
    actualCheckIn: nowBangkok,
    lateMinutes,
    latePenalty,
    bookingId: detail.Booking_ID,
    licensePlate: detail.LicensePlate
  });
});

// Check-out (with Overtime Penalty *2 calculation)
app.post('/api/scan/check-out', authenticate, (req, res) => {
  const { qrToken, bookingId } = req.body;

  let detail;
  if (qrToken) {
    detail = db.prepare(`
      SELECT d.*, s.Lot_ID, l.FeeRate_Per_Hour, l.LotName, l.ParkingOwner_ID
      FROM Reservation_Detail d
      JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE d.QRToken = ?
    `).get(qrToken);
  } else if (bookingId) {
    detail = db.prepare(`
      SELECT d.*, s.Lot_ID, l.FeeRate_Per_Hour, l.LotName, l.ParkingOwner_ID
      FROM Reservation_Detail d
      JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE d.Booking_ID = ?
    `).get(bookingId);
  }

  if (!detail) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลตั๋วการจองจากรหัสนี้' });
  }

  if (req.user.role === 'Owner' && detail.ParkingOwner_ID !== req.user.id) {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์จัดการตั๋วของลานจอดนี้' });
  }

  if (detail.Reservation_Status !== 'Checked_In') {
    return res.status(400).json({ 
      error: `ไม่สามารถเช็คเอาท์ได้ สถานะการจองคือ '${detail.Reservation_Status}' (ต้องเป็น Checked_In เท่านั้น)` 
    });
  }

  const usage = db.prepare(`SELECT * FROM UsageLog WHERE Booking_ID = ? ORDER BY Log_ID DESC LIMIT 1`).get(detail.Booking_ID);
  if (!usage || !usage.Actual_Check_In) {
    return res.status(400).json({ error: 'ไม่พบบันทึกเวลาเช็คอินของรายการนี้' });
  }

  const nowBangkok = getBangkokNow();
  const outTime = parseDateSafeServer(nowBangkok)?.getTime() || Date.now();
  const inTime = parseDateSafeServer(usage.Actual_Check_In)?.getTime() || Date.now();
  const parkedMin = Math.max(1, Math.ceil((outTime - inTime) / 60000));

  // Check Overtime against Booked_End
  const bookedEndTime = parseDateSafeServer(detail.Booked_End)?.getTime() || Date.now();
  let overtimePenalty = 0;
  let overtimeMinutes = 0;

  if (outTime > bookedEndTime) {
    overtimeMinutes = Math.max(0, Math.ceil((outTime - bookedEndTime) / 60000));
    // Grace period: 5 mins
    if (overtimeMinutes > 5) {
      const overtimeHours = Math.ceil(overtimeMinutes / 60);
      const normalRate = detail.FeeRate_Per_Hour || 20;
      // Overtime penalty is *2 of normal parking rate:
      overtimePenalty = overtimeHours * (normalRate * 2);
    }
  }

  const latePenalty = detail.Late_Penalty || 0;
  const totalPenalties = latePenalty + overtimePenalty;
  const newTotalFee = (detail.Base_Fee || 0) + totalPenalties;

  // Update UsageLog with Actual_Check_Out
  db.prepare(`
    UPDATE UsageLog
    SET Actual_Check_Out = ?, Updated_At = ?, Updated_By = ?
    WHERE Log_ID = ?
  `).run(nowBangkok, nowBangkok, req.user.username || 'System', usage.Log_ID);
  syncRow('UsageLog', usage.Log_ID);

  if (totalPenalties > 0) {
    // Requires final payment for penalties (late check-in or overtime *2)
    db.prepare(`
      UPDATE Reservation_Detail
      SET Reservation_Status = 'Awaiting_Final_Payment',
          Parked_Minutes = ?,
          Overtime_Penalty = ?,
          Totalfee = ?,
          Updated_At = ?
      WHERE Booking_ID = ?
    `).run(parkedMin, overtimePenalty, newTotalFee, nowBangkok, detail.Booking_ID);

    try {
      const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(detail.Booking_ID);
      if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
    } catch (_) {}

    logAudit('CHECK_OUT_OVERTIME', req.user.role, req.user.id, req.user.username, `Checkout Booking ${detail.Booking_ID}, penalties ฿${totalPenalties} (Overtime *2: ฿${overtimePenalty}, Late: ฿${latePenalty})`);

    return res.json({
      success: true,
      status: 'Awaiting_Final_Payment',
      message: `เช็คเอาท์เรียบร้อย มีค่าปรับที่ต้องชำระเพิ่ม ฿${totalPenalties} (จอดเกินเวลาปรับ 2 เท่า = ฿${overtimePenalty}, ค่าปรับมาสาย = ฿${latePenalty})`,
      bookingId: detail.Booking_ID,
      actualCheckIn: usage.Actual_Check_In,
      actualCheckOut: nowBangkok,
      feeBreakdown: {
        parkedMin,
        baseFee: detail.Base_Fee,
        latePenalty,
        overtimeMinutes,
        overtimePenalty,
        totalPenalties,
        totalFee: newTotalFee,
        balance: totalPenalties
      }
    });
  } else {
    // No penalties! Completed immediately
    db.prepare(`
      UPDATE Reservation_Detail
      SET Reservation_Status = 'Completed',
          Parked_Minutes = ?,
          Overtime_Penalty = 0,
          Totalfee = Base_Fee,
          Updated_At = ?
      WHERE Booking_ID = ?
    `).run(parkedMin, nowBangkok, detail.Booking_ID);

    // Free up slot immediately
    db.prepare(`
      UPDATE ParkingSlot
      SET ParkingSlot_Status = 'Available', Updated_At = ?
      WHERE Slot_ID = ?
    `).run(nowBangkok, detail.Slot_ID);

    syncRow('ParkingSlot', detail.Slot_ID);
    try {
      const detailRow = db.prepare('SELECT * FROM Reservation_Detail WHERE Booking_ID = ?').get(detail.Booking_ID);
      if (detailRow) syncEntityRecord('Reservation_Detail', detailRow);
    } catch (_) {}

    logAudit('CHECK_OUT_COMPLETED', req.user.role, req.user.id, req.user.username, `Checkout completed Booking ${detail.Booking_ID}, no penalties, slot released`);

    return res.json({
      success: true,
      status: 'Completed',
      message: 'เช็คเอาท์สำเร็จ ตรงตามเวลาที่จองไว้ ไม่มีค่าปรับเพิ่มเติม ช่องจอดคืนสถานะว่างแล้ว',
      bookingId: detail.Booking_ID,
      actualCheckIn: usage.Actual_Check_In,
      actualCheckOut: nowBangkok,
      feeBreakdown: {
        parkedMin,
        baseFee: detail.Base_Fee,
        latePenalty: 0,
        overtimePenalty: 0,
        totalPenalties: 0,
        totalFee: detail.Base_Fee,
        balance: 0
      }
    });
  }
});

// -------------------------------------------------------------
// 5. Favorites Endpoints (/api/favorites)
// -------------------------------------------------------------

app.get('/api/favorites', authenticate, (req, res) => {
  const lots = db.prepare(`
    SELECT l.*, f.Favorite_ID
    FROM FavoriteLot f
    JOIN ParkingLot l ON f.Lot_ID = l.Lot_ID
    WHERE f.Customer_ID = ?
    ORDER BY f.Favorite_ID DESC
  `).all(req.user.id);
  res.json(lots);
});

app.post('/api/favorites/:lotId', authenticate, (req, res) => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO FavoriteLot (Customer_ID, Lot_ID)
      VALUES (?, ?)
    `).run(req.user.id, req.params.lotId);
    try {
      const fav = db.prepare('SELECT * FROM FavoriteLot WHERE Customer_ID = ? AND Lot_ID = ?').get(req.user.id, req.params.lotId);
      if (fav) syncEntityRecord('FavoriteLot', fav);
    } catch (_) {}
    res.json({ success: true, message: 'บันทึกเป็นลานโปรดแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/favorites/:lotId', authenticate, (req, res) => {
  try {
    const fav = db.prepare('SELECT Favorite_ID FROM FavoriteLot WHERE Customer_ID = ? AND Lot_ID = ?').get(req.user.id, req.params.lotId);
    if (fav) deleteEntityRecord('FavoriteLot', fav.Favorite_ID);
  } catch (_) {}

  db.prepare(`
    DELETE FROM FavoriteLot WHERE Customer_ID = ? AND Lot_ID = ?
  `).run(req.user.id, req.params.lotId);
  res.json({ success: true, message: 'ลบออกจากรายการโปรดแล้ว' });
});

// -------------------------------------------------------------
// 6. Complaints Endpoints (/api/complaints)
// -------------------------------------------------------------

app.get('/api/complaints', authenticate, (req, res) => {
  let rows;
  if (req.user.role === 'Admin') {
    rows = db.prepare(`
      SELECT c.*, cust.Username AS CustomerUsername, cust.FName, cust.LName, cust.Phone_Number
      FROM Complaint c
      JOIN Customer cust ON c.Customer_ID = cust.Customer_ID
      ORDER BY c.Complaint_ID DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT c.*, cust.Username AS CustomerUsername
      FROM Complaint c
      JOIN Customer cust ON c.Customer_ID = cust.Customer_ID
      WHERE c.Customer_ID = ?
      ORDER BY c.Complaint_ID DESC
    `).all(req.user.id);
  }
  res.json(rows);
});

app.post('/api/complaints', authenticate, (req, res) => {
  const { title, description, bookingId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'กรุณากรอกหัวข้อและรายละเอียดข้อร้องเรียน' });
  }

  const stmt = db.prepare(`
    INSERT INTO Complaint (Customer_ID, Booking_ID, Title, Description, Complaint_Status, Created_By, Updated_By)
    VALUES (?, ?, ?, ?, 'Pending', ?, ?)
  `);
  const result = stmt.run(req.user.id, bookingId || null, title, description, req.user.username || 'Customer', req.user.username || 'Customer');
  syncRow('Complaint', Number(result.lastInsertRowid));

  logAudit('SUBMIT_COMPLAINT', req.user.role, req.user.id, req.user.username, `Complaint submitted: ${title}`);
  res.json({ success: true, message: 'ส่งข้อร้องเรียนเรียบร้อย เจ้าหน้าที่จะตรวจสอบโดยเร็ว' });
});

app.patch('/api/complaints/:id', authenticate, requireRole('Admin'), (req, res) => {
  const { status, adminResponse } = req.body;
  db.prepare(`
    UPDATE Complaint
    SET Complaint_Status = ?, Admin_Response = ?, Admin_ID = ?, Updated_At = datetime('now', '+7 hours'), Updated_By = ?
    WHERE Complaint_ID = ?
  `).run(status, adminResponse, req.user.id, req.user.username || 'Admin', req.params.id);

  syncRow('Complaint', req.params.id);
  logAudit('RESOLVE_COMPLAINT', 'Admin', req.user.id, req.user.username, `Complaint ${req.params.id} updated to ${status}`);
  res.json({ success: true, message: 'บันทึกการตอบกลับเรียบร้อย' });
});

// -------------------------------------------------------------
// 7. Dashboards & Reports (/api/owner/dashboard, /api/admin/dashboard, /api/reports)
// -------------------------------------------------------------

// Owner dashboard (isolated per owner, admin sees all)
app.get('/api/owner/dashboard', authenticate, requireRole('Owner', 'Admin'), (req, res) => {
  let lots;
  if (req.user.role === 'Owner') {
    lots = db.prepare(`SELECT * FROM ParkingLot WHERE ParkingOwner_ID = ?`).all(req.user.id);
  } else {
    lots = db.prepare(`SELECT * FROM ParkingLot`).all();
  }

  // Only Approved ('Active') lots count as active lots under supervision
  const activeLots = lots.filter(l => l.ParkingLot_Status === 'Active');
  const activeLotIds = activeLots.map(l => l.Lot_ID);
  const pendingLotsCount = lots.filter(l => l.ParkingLot_Status === 'Pending').length;
  const rejectedLotsCount = lots.filter(l => l.ParkingLot_Status === 'Rejected').length;

  const allLotIds = lots.map(l => l.Lot_ID);

  if (allLotIds.length === 0) {
    return res.json({
      totalLots: 0,
      totalSlots: 0,
      occupiedSlots: 0,
      availableSlots: 0,
      reservedSlots: 0,
      pendingLotsCount: 0,
      rejectedLotsCount: 0,
      todayRevenue: 0,
      lots: [],
      recentBookings: []
    });
  }

  // Only calculate slot stats for Approved (Active) lots under supervision
  let slotStats = { totalSlots: 0, occupiedSlots: 0, availableSlots: 0, reservedSlots: 0 };
  if (activeLotIds.length > 0) {
    const activePlaceholders = activeLotIds.map(() => '?').join(',');
    slotStats = db.prepare(`
      SELECT 
        COUNT(*) AS totalSlots,
        SUM(CASE WHEN ParkingSlot_Status = 'Occupied' THEN 1 ELSE 0 END) AS occupiedSlots,
        SUM(CASE WHEN ParkingSlot_Status = 'Available' THEN 1 ELSE 0 END) AS availableSlots,
        SUM(CASE WHEN ParkingSlot_Status = 'Reserved' THEN 1 ELSE 0 END) AS reservedSlots
      FROM ParkingSlot
      WHERE Lot_ID IN (${activePlaceholders})
    `).get(...activeLotIds) || slotStats;
  }

  const allPlaceholders = allLotIds.map(() => '?').join(',');

  const revenueStats = db.prepare(`
    SELECT COALESCE(SUM(p.Amount), 0) AS totalRevenue
    FROM Payment p
    JOIN Reservation r ON p.Booking_ID = r.Booking_ID
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    WHERE s.Lot_ID IN (${allPlaceholders})
  `).get(...allLotIds);

  const recentBookings = db.prepare(`
    SELECT 
      r.Booking_ID, r.ReserveDate, d.LicensePlate, d.Reservation_Status,
      d.Totalfee, d.Base_Fee, d.Overtime_Penalty, d.Late_Penalty, d.QRToken,
      s.SpaceCode, l.LotName
    FROM Reservation r
    JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
    JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
    JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
    WHERE l.Lot_ID IN (${allPlaceholders})
    ORDER BY r.Booking_ID DESC
    LIMIT 15
  `).all(...allLotIds);

  res.json({
    totalLots: activeLots.length, // Only approved (Active) lots count in "ลานจอดในการดูแล"
    lots, // Return all owner lots so owner can track approval status in list
    ...slotStats,
    pendingLotsCount,
    rejectedLotsCount,
    todayRevenue: revenueStats?.totalRevenue || 0,
    recentBookings
  });
});

app.get('/api/admin/dashboard', authenticate, requireRole('Admin'), (req, res) => {
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM Customer').get().count;
  const ownerCount = db.prepare('SELECT COUNT(*) as count FROM Parking_Owner').get().count;
  const lotCount = db.prepare('SELECT COUNT(*) as count FROM ParkingLot').get().count;
  const slotCount = db.prepare('SELECT COUNT(*) as count FROM ParkingSlot').get().count;
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM Reservation').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(Amount), 0) as total FROM Payment').get().total;
  const complaintPending = db.prepare("SELECT COUNT(*) as count FROM Complaint WHERE Complaint_Status = 'Pending'").get().count;

  const recentLogs = db.prepare('SELECT * FROM AuditLog ORDER BY Audit_ID DESC LIMIT 15').all();

  res.json({
    customerCount,
    ownerCount,
    lotCount,
    slotCount,
    bookingCount,
    totalRevenue,
    complaintPending,
    recentLogs
  });
});

app.get('/api/admin/users', authenticate, requireRole('Admin'), (req, res) => {
  const customers = db.prepare(`
    SELECT 
      c.Customer_ID as id,
      c.Username,
      c.FName,
      c.LName,
      c.Phone_Number,
      c.Email,
      c.Account_Status,
      c.Created_At,
      'Customer' as role,
      COUNT(r.Booking_ID) as totalBookings
    FROM Customer c
    LEFT JOIN Reservation r ON c.Customer_ID = r.Customer_ID
    GROUP BY c.Customer_ID
    ORDER BY c.Customer_ID DESC
  `).all();

  const owners = db.prepare(`
    SELECT 
      o.ParkingOwner_ID as id,
      o.Username,
      o.FName,
      o.LName,
      o.Phone_Number,
      o.Email,
      o.Bank_Account,
      o.Account_Status,
      o.Created_At,
      'Owner' as role,
      COUNT(l.Lot_ID) as totalLots
    FROM Parking_Owner o
    LEFT JOIN ParkingLot l ON o.ParkingOwner_ID = l.ParkingOwner_ID
    GROUP BY o.ParkingOwner_ID
    ORDER BY o.ParkingOwner_ID DESC
  `).all();

  res.json({ customers, owners });
});

app.patch('/api/admin/users/:role/:id', authenticate, requireRole('Admin'), (req, res) => {
  const { role, id } = req.params;
  const { status } = req.body;
  const targetId = Number(id);

  if (role === 'Customer') {
    db.prepare('UPDATE Customer SET Account_Status = ?, Updated_At = datetime(\'now\', \'+7 hours\') WHERE Customer_ID = ?').run(status, targetId);
    syncRow('Customer', targetId);
    logAudit('UPDATE_USER_STATUS', 'Admin', req.user.id, req.user.username, `Updated Customer #${targetId} status to ${status}`);
  } else if (role === 'Owner') {
    db.prepare('UPDATE Parking_Owner SET Account_Status = ?, Updated_At = datetime(\'now\', \'+7 hours\') WHERE ParkingOwner_ID = ?').run(status, targetId);
    syncRow('Parking_Owner', targetId);
    logAudit('UPDATE_OWNER_STATUS', 'Admin', req.user.id, req.user.username, `Updated Owner #${targetId} status to ${status}`);
  }
  res.json({ success: true, message: `อัปเดตสถานะบัญชีเรียบร้อยแล้ว (${status})` });
});

// Admin Customer CRUD
app.post('/api/admin/customers', authenticate, requireRole('Admin'), (req, res) => {
  const { username, password, fname, lname, phone, email } = req.body;
  if (!username || !password || !fname || !lname) {
    return res.status(400).json({ error: 'กรุณากรอก Username, Password, ชื่อ และนามสกุล' });
  }

  const existing = db.prepare('SELECT Customer_ID FROM Customer WHERE Username = ?').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO Customer (Username, Password_Hash, FName, LName, Phone_Number, Email, Account_Status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `).run(username.trim(), hash, fname.trim(), lname.trim(), phone || '', email || '');

  const newId = Number(info.lastInsertRowid);
  syncRow('Customer', newId);
  logAudit('CREATE_CUSTOMER', 'Admin', req.user.id, req.user.username, `Created Customer #${newId} (${username})`);

  res.json({ success: true, message: 'เพิ่มบัญชีลูกค้าสำเร็จ', id: newId });
});

app.put('/api/admin/customers/:id', authenticate, requireRole('Admin'), (req, res) => {
  const id = Number(req.params.id);
  const { fname, lname, phone, email, password } = req.body;
  if (!fname || !lname) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อและนามสกุล' });
  }

  if (password && password.trim()) {
    const hash = bcrypt.hashSync(password.trim(), 10);
    db.prepare(`
      UPDATE Customer 
      SET FName = ?, LName = ?, Phone_Number = ?, Email = ?, Password_Hash = ?, Updated_At = datetime('now', '+7 hours')
      WHERE Customer_ID = ?
    `).run(fname.trim(), lname.trim(), phone || '', email || '', hash, id);
  } else {
    db.prepare(`
      UPDATE Customer 
      SET FName = ?, LName = ?, Phone_Number = ?, Email = ?, Updated_At = datetime('now', '+7 hours')
      WHERE Customer_ID = ?
    `).run(fname.trim(), lname.trim(), phone || '', email || '', id);
  }

  syncRow('Customer', id);
  logAudit('UPDATE_CUSTOMER', 'Admin', req.user.id, req.user.username, `Updated Customer #${id}`);
  res.json({ success: true, message: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว' });
});

app.delete('/api/admin/customers/:id', authenticate, requireRole('Admin'), (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM Customer WHERE Customer_ID = ?').run(id);
  logAudit('DELETE_CUSTOMER', 'Admin', req.user.id, req.user.username, `Deleted Customer #${id}`);
  res.json({ success: true, message: 'ลบบัญชีลูกค้าเรียบร้อยแล้ว' });
});

app.get('/api/reports/revenue', authenticate, requireRole('Admin', 'Owner'), (req, res) => {
  let revenueByLot;
  let recentPayments;

  if (req.user.role === 'Owner') {
    revenueByLot = db.prepare(`
      SELECT 
        l.Lot_ID, l.LotName, l.District,
        COUNT(DISTINCT r.Booking_ID) AS totalBookings,
        COALESCE(SUM(p.Amount), 0) AS totalRevenue
      FROM ParkingLot l
      LEFT JOIN ParkingSlot s ON l.Lot_ID = s.Lot_ID
      LEFT JOIN Reservation_Detail d ON s.Slot_ID = d.Slot_ID
      LEFT JOIN Reservation r ON d.Booking_ID = r.Booking_ID
      LEFT JOIN Payment p ON r.Booking_ID = p.Booking_ID
      WHERE l.ParkingOwner_ID = ?
      GROUP BY l.Lot_ID
      ORDER BY totalRevenue DESC
    `).all(req.user.id);

    recentPayments = db.prepare(`
      SELECT p.*, r.Customer_ID, c.Username
      FROM Payment p
      JOIN Reservation r ON p.Booking_ID = r.Booking_ID
      JOIN Customer c ON r.Customer_ID = c.Customer_ID
      JOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID
      JOIN ParkingSlot s ON d.Slot_ID = s.Slot_ID
      JOIN ParkingLot l ON s.Lot_ID = l.Lot_ID
      WHERE l.ParkingOwner_ID = ?
      ORDER BY p.Payment_ID DESC
      LIMIT 30
    `).all(req.user.id);
  } else {
    revenueByLot = db.prepare(`
      SELECT 
        l.Lot_ID, l.LotName, l.District,
        COUNT(DISTINCT r.Booking_ID) AS totalBookings,
        COALESCE(SUM(p.Amount), 0) AS totalRevenue
      FROM ParkingLot l
      LEFT JOIN ParkingSlot s ON l.Lot_ID = s.Lot_ID
      LEFT JOIN Reservation_Detail d ON s.Slot_ID = d.Slot_ID
      LEFT JOIN Reservation r ON d.Booking_ID = r.Booking_ID
      LEFT JOIN Payment p ON r.Booking_ID = p.Booking_ID
      GROUP BY l.Lot_ID
      ORDER BY totalRevenue DESC
    `).all();

    recentPayments = db.prepare(`
      SELECT p.*, r.Customer_ID, c.Username
      FROM Payment p
      JOIN Reservation r ON p.Booking_ID = r.Booking_ID
      JOIN Customer c ON r.Customer_ID = c.Customer_ID
      ORDER BY p.Payment_ID DESC
      LIMIT 30
    `).all();
  }

  res.json({ revenueByLot, recentPayments });
});

// -------------------------------------------------------------
// 8. Automated Periodic Tasks
// -------------------------------------------------------------

function runBackgroundJobs() {
  try {
    // 1. Expire Unpaid Bookings (> 10 mins in 'Pending_Payment')
    const expiredUnpaid = db.prepare(`
      SELECT d.Booking_ID, d.Slot_ID
      FROM Reservation_Detail d
      WHERE d.Reservation_Status = 'Pending_Payment'
        AND datetime(d.Created_At, '+10 minutes') < datetime('now', '+7 hours')
    `).all();

    for (const item of expiredUnpaid) {
      db.prepare(`
        UPDATE Reservation_Detail
        SET Reservation_Status = 'Expired', Updated_At = datetime('now', '+7 hours')
        WHERE Booking_ID = ?
      `).run(item.Booking_ID);

      db.prepare(`
        UPDATE ParkingSlot
        SET ParkingSlot_Status = 'Available', Updated_At = datetime('now', '+7 hours')
        WHERE Slot_ID = ?
      `).run(item.Slot_ID);

      logAudit('AUTO_EXPIRE_UNPAID', 'System', null, 'System', `Expired unpaid booking ${item.Booking_ID}`);
    }

    // 2. Handle No-Show (> Hold_Until and status is 'Confirmed' without check-in)
    const noShows = db.prepare(`
      SELECT d.Booking_ID, d.Slot_ID
      FROM Reservation_Detail d
      WHERE d.Reservation_Status = 'Confirmed'
        AND datetime(d.Hold_Until) < datetime('now', '+7 hours')
    `).all();

    for (const item of noShows) {
      db.prepare(`
        UPDATE Reservation_Detail
        SET Reservation_Status = 'Expired', Updated_At = datetime('now', '+7 hours')
        WHERE Booking_ID = ?
      `).run(item.Booking_ID);

      db.prepare(`
        UPDATE ParkingSlot
        SET ParkingSlot_Status = 'Available', Updated_At = datetime('now', '+7 hours')
        WHERE Slot_ID = ?
      `).run(item.Slot_ID);

      logAudit('AUTO_NO_SHOW_EXPIRE', 'System', null, 'System', `No-show expired booking ${item.Booking_ID}`);
    }
  } catch (err) {
    console.error('Background job error:', err.message);
  }
}

setInterval(runBackgroundJobs, 30000);

// -------------------------------------------------------------
// 8. Database Inspector Endpoints (/api/admin/database)
// -------------------------------------------------------------

// List all entities with schema metadata and real-time record counts
app.get('/api/admin/database/entities', authenticate, requireRole('Admin'), (req, res) => {
  try {
    const list = Object.keys(ENTITY_DEFINITIONS).map(entityName => {
      const def = ENTITY_DEFINITIONS[entityName];
      let count = 0;
      try {
        const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${entityName}`).get();
        count = countRow ? countRow.count : 0;
      } catch (_) {}

      return {
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
      };
    });

    const totalRecords = list.reduce((sum, item) => sum + item.recordCount, 0);

    res.json({
      success: true,
      totalEntities: list.length,
      totalRecords,
      entities: list
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get live data and schema dictionary for a specific entity
app.get('/api/admin/database/entities/:entityName', authenticate, requireRole('Admin'), (req, res) => {
  const { entityName } = req.params;
  const def = ENTITY_DEFINITIONS[entityName];

  if (!def) {
    return res.status(404).json({ error: `ไม่พบตาราง Entity '${entityName}' ในระบบ` });
  }

  try {
    const { q, limit = 100, page = 1 } = req.query;
    const numLimit = Math.min(500, Math.max(1, Number(limit) || 100));
    const offset = (Math.max(1, Number(page) || 1) - 1) * numLimit;

    let totalCount = 0;
    try {
      totalCount = db.prepare(`SELECT COUNT(*) as count FROM ${entityName}`).get().count;
    } catch (_) {}

    let records = [];
    if (q && q.trim()) {
      const searchTerms = q.trim().toLowerCase();
      const allRows = db.prepare(`SELECT * FROM ${entityName}`).all();
      const filtered = allRows.filter(row => {
        return Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerms)
        );
      });
      totalCount = filtered.length;
      records = filtered.slice(offset, offset + numLimit);
    } else {
      records = db.prepare(`SELECT * FROM ${entityName} LIMIT ? OFFSET ?`).all(numLimit, offset);
    }

    const incomingRelations = ER_RELATIONSHIPS.filter(r => r.toTable === entityName);
    const outgoingRelations = ER_RELATIONSHIPS.filter(r => r.fromTable === entityName);

    res.json({
      success: true,
      entity: def,
      totalRecords: totalCount,
      page: Number(page) || 1,
      limit: numLimit,
      records,
      relations: {
        incoming: incomingRelations,
        outgoing: outgoingRelations
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ER relationships and complete schema diagram data
app.get('/api/admin/database/erd', authenticate, requireRole('Admin'), (req, res) => {
  res.json({
    success: true,
    entities: ENTITY_DEFINITIONS,
    relationships: ER_RELATIONSHIPS
  });
});

// Get real-world web usage flow stages (Customer & Parking_Owner action tracing)
app.get('/api/admin/database/data-flows', authenticate, requireRole('Admin'), (req, res) => {
  res.json({
    success: true,
    stages: DATA_FLOW_STAGES
  });
});

// Get official Oracle SQL DDL script matching Relational_Diagram.pdf
app.get('/api/admin/database/ddl-script', authenticate, requireRole('Admin'), (req, res) => {
  res.json({
    success: true,
    ddl: ORACLE_SQL_DDL
  });
});

// Execute read-only SQL query against SQLite database (Inspector Console)
app.post('/api/admin/database/query', authenticate, requireRole('Admin'), (req, res) => {
  const { sql } = req.body;
  if (!sql || !sql.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุคำสั่ง SQL ที่ต้องการรัน' });
  }

  const trimmedSql = sql.trim();
  // Allow read-only statements: SELECT, PRAGMA, EXPLAIN, WITH
  const isReadOnly = /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(trimmedSql);
  if (!isReadOnly) {
    return res.status(400).json({ 
      error: 'เพื่อความปลอดภัย คอนโซลนี้อนุญาตเฉพาะคำสั่งอ่านข้อมูล (SELECT, PRAGMA, EXPLAIN, WITH) เท่านั้น' 
    });
  }

  try {
    const startTime = Date.now();
    const rows = db.prepare(trimmedSql).all();
    const durationMs = Date.now() - startTime;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    res.json({
      success: true,
      columns,
      rows,
      rowCount: rows.length,
      durationMs
    });
  } catch (err) {
    res.status(400).json({ error: `SQL Error: ${err.message}` });
  }
});

// -------------------------------------------------------------
// 9. Production Client Servicing (SPA Fallback)
// -------------------------------------------------------------
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/images/')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send('ParkSmart Backend API is running!');
    }
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚗 ParkSmart Server running at http://localhost:${PORT}`);
  console.log(`📍 Serving API, SQLite database, and Web Client`);
  console.log(`=================================================`);
});
