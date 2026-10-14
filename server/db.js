const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'parking.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Customer (
      Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      Password_Hash TEXT NOT NULL,
      FName TEXT NOT NULL,
      LName TEXT NOT NULL,
      Phone_Number TEXT,
      Email TEXT,
      Account_Status TEXT DEFAULT 'Active',
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours'))
    );

    CREATE TABLE IF NOT EXISTS Parking_Owner (
      ParkingOwner_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      Password_Hash TEXT NOT NULL,
      FName TEXT NOT NULL,
      LName TEXT NOT NULL,
      Phone_Number TEXT,
      Email TEXT,
      Bank_Account TEXT,
      Account_Status TEXT DEFAULT 'Active',
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours'))
    );

    CREATE TABLE IF NOT EXISTS Administrator (
      Admin_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      Password_Hash TEXT NOT NULL,
      FName TEXT NOT NULL,
      LName TEXT NOT NULL,
      Email TEXT,
      Phone_Number TEXT,
      Admin_Level TEXT DEFAULT 'SuperAdmin',
      Account_Status TEXT DEFAULT 'Active',
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours'))
    );

    CREATE TABLE IF NOT EXISTS ParkingLot (
      Lot_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      ParkingOwner_ID INTEGER,
      LotName TEXT NOT NULL,
      Location TEXT NOT NULL,
      District TEXT NOT NULL,
      Province TEXT DEFAULT 'ขอนแก่น',
      Latitude REAL,
      Longitude REAL,
      OpenTime TEXT DEFAULT '10:00',
      CloseTime TEXT DEFAULT '22:00',
      FeeRate_Per_Hour REAL DEFAULT 20,
      Free_Minutes INTEGER DEFAULT 0,
      Billing_Unit_Min INTEGER DEFAULT 60,
      Daily_Max_Fee REAL DEFAULT 200,
      Deposit_Amount REAL DEFAULT 20,
      Is_Recommended INTEGER DEFAULT 0,
      Recommended_Order INTEGER DEFAULT 0,
      ParkingLot_Status TEXT DEFAULT 'Active',
      Image_Url TEXT,
      Description TEXT,
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (ParkingOwner_ID) REFERENCES Parking_Owner(ParkingOwner_ID)
    );

    CREATE TABLE IF NOT EXISTS ParkingSlot (
      Slot_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Lot_ID INTEGER NOT NULL,
      SpaceCode TEXT NOT NULL,
      Floor TEXT NOT NULL,
      Zone TEXT NOT NULL,
      ParkingSlot_Status TEXT DEFAULT 'Available',
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Lot_ID) REFERENCES ParkingLot(Lot_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Reservation (
      Booking_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Customer_ID INTEGER NOT NULL,
      ReserveDate TEXT DEFAULT (datetime('now', '+7 hours')),
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
    );

    CREATE TABLE IF NOT EXISTS Reservation_Detail (
      Detail_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Booking_ID INTEGER NOT NULL,
      Slot_ID INTEGER NOT NULL,
      LicensePlate TEXT NOT NULL,
      Expected_Arrival TEXT NOT NULL,
      Hold_Until TEXT NOT NULL,
      Booked_Hours INTEGER DEFAULT 2,
      Booked_End TEXT,
      Base_Fee REAL DEFAULT 0,
      Late_Penalty REAL DEFAULT 0,
      Overtime_Penalty REAL DEFAULT 0,
      Deposit_Amount REAL DEFAULT 0,
      Parked_Minutes INTEGER DEFAULT 0,
      Totalfee REAL DEFAULT 0,
      Reservation_Status TEXT DEFAULT 'Pending_Payment',
      QRToken TEXT UNIQUE NOT NULL,
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Booking_ID) REFERENCES Reservation(Booking_ID) ON DELETE CASCADE,
      FOREIGN KEY (Slot_ID) REFERENCES ParkingSlot(Slot_ID)
    );

    CREATE TABLE IF NOT EXISTS UsageLog (
      Log_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Booking_ID INTEGER NOT NULL,
      Slot_ID INTEGER NOT NULL,
      Actual_Check_In TEXT,
      Actual_Check_Out TEXT,
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      Updated_At TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Booking_ID) REFERENCES Reservation(Booking_ID),
      FOREIGN KEY (Slot_ID) REFERENCES ParkingSlot(Slot_ID)
    );

    CREATE TABLE IF NOT EXISTS Payment (
      Payment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Booking_ID INTEGER NOT NULL,
      Amount REAL NOT NULL,
      Payment_Type TEXT NOT NULL,
      Payment_Method TEXT DEFAULT 'PromptPay',
      Payment_Status TEXT DEFAULT 'Completed',
      Payment_Date TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Booking_ID) REFERENCES Reservation(Booking_ID)
    );

    CREATE TABLE IF NOT EXISTS Complaint (
      Complaint_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Booking_ID INTEGER,
      Customer_ID INTEGER NOT NULL,
      Admin_ID INTEGER,
      Title TEXT NOT NULL,
      Description TEXT NOT NULL,
      Complaint_Status TEXT DEFAULT 'Pending',
      Admin_Response TEXT,
      Complaint_Date TEXT DEFAULT (datetime('now', '+7 hours')),
      FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID),
      FOREIGN KEY (Booking_ID) REFERENCES Reservation(Booking_ID),
      FOREIGN KEY (Admin_ID) REFERENCES Administrator(Admin_ID)
    );

    CREATE TABLE IF NOT EXISTS AuditLog (
      Audit_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Action TEXT NOT NULL,
      User_Type TEXT NOT NULL,
      User_ID INTEGER,
      Username TEXT,
      Details TEXT,
      Created_At TEXT DEFAULT (datetime('now', '+7 hours'))
    );

    CREATE TABLE IF NOT EXISTS FavoriteLot (
      Favorite_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Customer_ID INTEGER NOT NULL,
      Lot_ID INTEGER NOT NULL,
      Created_At TEXT DEFAULT (datetime('now', '+7 hours')),
      UNIQUE(Customer_ID, Lot_ID),
      FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID),
      FOREIGN KEY (Lot_ID) REFERENCES ParkingLot(Lot_ID)
    );
  `);

  ensureCourseSchemaColumns();
  seedData();
}

function ensureCourseSchemaColumns() {
  const columnsToAdd = [
    { table: 'Customer', column: 'Created_By', type: 'TEXT' },
    { table: 'Customer', column: 'Updated_By', type: 'TEXT' },
    { table: 'Parking_Owner', column: 'Created_By', type: 'TEXT' },
    { table: 'Parking_Owner', column: 'Updated_By', type: 'TEXT' },
    { table: 'Administrator', column: 'Created_By', type: 'TEXT' },
    { table: 'Administrator', column: 'Updated_By', type: 'TEXT' },
    { table: 'ParkingLot', column: 'FeeRate', type: 'REAL' },
    { table: 'ParkingLot', column: 'Created_By', type: 'TEXT' },
    { table: 'ParkingLot', column: 'Updated_By', type: 'TEXT' },
    { table: 'ParkingSlot', column: 'Created_By', type: 'TEXT' },
    { table: 'ParkingSlot', column: 'Updated_By', type: 'TEXT' },
    { table: 'FavoriteLot', column: 'Saved_Date', type: 'TEXT' },
    { table: 'Reservation', column: 'Created_By', type: 'TEXT' },
    { table: 'Reservation', column: 'Updated_By', type: 'TEXT' },
    { table: 'Reservation_Detail', column: 'StartTime', type: 'TEXT' },
    { table: 'Reservation_Detail', column: 'EndTime', type: 'TEXT' },
    { table: 'Reservation_Detail', column: 'Created_By', type: 'TEXT' },
    { table: 'Reservation_Detail', column: 'Updated_By', type: 'TEXT' },
    { table: 'UsageLog', column: 'Created_By', type: 'TEXT' },
    { table: 'UsageLog', column: 'Updated_By', type: 'TEXT' },
    { table: 'Payment', column: 'Created_At', type: 'TEXT' },
    { table: 'Payment', column: 'Created_By', type: 'TEXT' },
    { table: 'Payment', column: 'Updated_At', type: 'TEXT' },
    { table: 'Payment', column: 'Updated_By', type: 'TEXT' },
    { table: 'Complaint', column: 'Created_At', type: 'TEXT' },
    { table: 'Complaint', column: 'Created_By', type: 'TEXT' },
    { table: 'Complaint', column: 'Updated_At', type: 'TEXT' },
    { table: 'Complaint', column: 'Updated_By', type: 'TEXT' }
  ];

  for (const item of columnsToAdd) {
    try {
      const existing = db.prepare(`PRAGMA table_info(${item.table})`).all();
      if (!existing.some(c => c.name.toLowerCase() === item.column.toLowerCase())) {
        db.exec(`ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.type};`);
      }
    } catch (_) {}
  }

  try {
    db.exec(`UPDATE ParkingLot SET FeeRate = FeeRate_Per_Hour WHERE FeeRate IS NULL;`);
    db.exec(`UPDATE ParkingLot SET FeeRate_Per_Hour = FeeRate WHERE FeeRate_Per_Hour IS NULL;`);
    db.exec(`UPDATE Reservation_Detail SET StartTime = Expected_Arrival WHERE StartTime IS NULL;`);
    db.exec(`UPDATE Reservation_Detail SET Expected_Arrival = StartTime WHERE Expected_Arrival IS NULL;`);
    db.exec(`UPDATE Reservation_Detail SET EndTime = Booked_End WHERE EndTime IS NULL;`);
    db.exec(`UPDATE Reservation_Detail SET Booked_End = EndTime WHERE Booked_End IS NULL;`);
    db.exec(`UPDATE FavoriteLot SET Saved_Date = Created_At WHERE Saved_Date IS NULL;`);
    db.exec(`UPDATE Customer SET Created_By = 'SYSTEM' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE Parking_Owner SET Created_By = 'SYSTEM' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE Administrator SET Created_By = 'SYSTEM' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE ParkingLot SET Created_By = 'SYSTEM' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE ParkingSlot SET Created_By = 'SYSTEM' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE Reservation SET Created_By = 'Customer' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE Reservation_Detail SET Created_By = 'Customer' WHERE Created_By IS NULL;`);
    db.exec(`UPDATE Payment SET Created_At = Payment_Date WHERE Created_At IS NULL;`);
    db.exec(`UPDATE Complaint SET Created_At = Complaint_Date WHERE Created_At IS NULL;`);

    // Sync triggers for keeping FeeRate <-> FeeRate_Per_Hour and StartTime <-> Expected_Arrival matched
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_parkinglot_sync_feerate
      AFTER INSERT ON ParkingLot
      BEGIN
        UPDATE ParkingLot
        SET FeeRate = COALESCE(NEW.FeeRate, NEW.FeeRate_Per_Hour, 20),
            FeeRate_Per_Hour = COALESCE(NEW.FeeRate_Per_Hour, NEW.FeeRate, 20)
        WHERE Lot_ID = NEW.Lot_ID;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_detail_sync_times
      AFTER INSERT ON Reservation_Detail
      BEGIN
        UPDATE Reservation_Detail
        SET StartTime = COALESCE(NEW.StartTime, NEW.Expected_Arrival),
            Expected_Arrival = COALESCE(NEW.Expected_Arrival, NEW.StartTime),
            EndTime = COALESCE(NEW.EndTime, NEW.Booked_End),
            Booked_End = COALESCE(NEW.Booked_End, NEW.EndTime)
        WHERE Booking_ID = NEW.Booking_ID AND Slot_ID = NEW.Slot_ID;
      END;
    `);
  } catch (err) {
    console.warn('[Course Schema Warning]:', err.message);
  }
}

function logAudit(action, userType, userId, username, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO AuditLog (Action, User_Type, User_ID, Username, Details)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(action, userType, userId || null, username || 'System', typeof details === 'object' ? JSON.stringify(details) : String(details));
    try {
      const { syncEntityRecord } = require('./firebase-sync');
      const row = db.prepare('SELECT * FROM AuditLog WHERE Audit_ID = ?').get(result.lastInsertRowid);
      if (row) syncEntityRecord('AuditLog', row);
    } catch (_) {}
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
}

function seedData() {
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM Administrator').get();
  if (adminCheck.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding ParkSmart with Single Owner and 7 real Khon Kaen lots...');

  // 1. Seed Accounts: Admin, 1 Owner (owns all lots), Customer 1, Customer 2
  const passAdmin = bcrypt.hashSync('admin123', 10);
  const passOwner = bcrypt.hashSync('owner123', 10);
  const passCust = bcrypt.hashSync('cust123', 10);

  db.prepare(`
    INSERT INTO Administrator (Username, Password_Hash, FName, LName, Email, Phone_Number, Admin_Level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('admin', passAdmin, 'สมศักดิ์', 'แอดมินใจดี', 'admin@parksmart.local', '089-999-0001', 'SuperAdmin');

  // Single Owner who owns ALL parking lots
  const ownerRes = db.prepare(`
    INSERT INTO Parking_Owner (Username, Password_Hash, FName, LName, Phone_Number, Email, Bank_Account)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('owner1', passOwner, 'วิชัย', 'ขอนแก่นพาร์คมาสเตอร์', '081-111-2222', 'owner@parksmart.local', 'กสิกรไทย 123-4-56789-0');
  const ownerId = Number(ownerRes.lastInsertRowid);

  const cust1Res = db.prepare(`
    INSERT INTO Customer (Username, Password_Hash, FName, LName, Phone_Number, Email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('customer1', passCust, 'กานต์', 'คนเดินทาง', '086-555-6666', 'customer1@parksmart.local');
  const cust1Id = Number(cust1Res.lastInsertRowid);

  db.prepare(`
    INSERT INTO Customer (Username, Password_Hash, FName, LName, Phone_Number, Email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('customer2', passCust, 'นภัสสร', 'แก้วมณี', '087-777-8888', 'customer2@parksmart.local');

  // 2. Seed 7 Recommended Lots (ALL owned by ownerId, Free_Minutes = 0)
  const lots = [
    {
      ownerId: ownerId,
      name: 'Central Khonkaen (เซ็นทรัล ขอนแก่น)',
      location: '99, 99/1 ถ.ศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4322,
      lng: 102.8236,
      open: '10:00',
      close: '22:00',
      rate: 20,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 200,
      deposit: 20,
      isRec: 1,
      order: 1,
      image: '/images/lots/central.jpg',
      desc: 'ศูนย์การค้าเซ็นทรัล ขอนแก่น ใจกลางเมืองขอนแก่น ถนนศรีจันทร์ อาคารจอดรถหลายชั้นเชื่อมต่อห้างโดยตรง ปลอดภัย ทันสมัย'
    },
    {
      ownerId: ownerId,
      name: 'Central Khonkaen Campus',
      location: 'ย่านกังสดาล ใกล้มหาวิทยาลัยขอนแก่น ต.ในเมือง อ.เมืองขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4485,
      lng: 102.8258,
      open: '10:00',
      close: '22:00',
      rate: 20,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 200,
      deposit: 20,
      isRec: 1,
      order: 2,
      image: '/images/lots/campus.webp',
      desc: 'ลานจอดรถย่านกังสดาล ใกล้ ม.ขอนแก่น (ประตูสีฐาน) สะดวกสำหรับนักศึกษาและผู้มาติดต่อมหาวิทยาลัย'
    },
    {
      ownerId: ownerId,
      name: 'Fairy Plaza (แฟรี่ พลาซ่า)',
      location: '69/9 ถ.กลางเมือง ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4251,
      lng: 102.8335,
      open: '10:00',
      close: '21:00',
      rate: 15,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 150,
      deposit: 15,
      isRec: 1,
      order: 3,
      image: '/images/lots/fairy.jpg',
      desc: 'ห้างสรรพสินค้าใจกลางเมืองขอนแก่น บนถนนกลางเมือง ปรับปรุงโฉมใหม่ 2025/2026 มีอาคารจอดรถในร่มสะดวกสบาย'
    },
    {
      ownerId: ownerId,
      name: 'ตึกแก่น (The Kaen Khon Kaen)',
      location: '250/1 ถ.ศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4294,
      lng: 102.8302,
      open: '10:00',
      close: '20:00',
      rate: 15,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 150,
      deposit: 15,
      isRec: 1,
      order: 4,
      image: '/images/lots/kaen.webp',
      desc: 'อาคารตึกแก่น ศูนย์กลางนวัตกรรมและความคิดสร้างสรรค์แห่งเมืองขอนแก่น ถนนศรีจันทร์ ที่จอดรถสะดวกสบายและทันสมัย'
    },
    {
      ownerId: ownerId,
      name: 'Big C 1 Khonkaen',
      location: '303 หมู่ 17 ถ.มิตรภาพ ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4178,
      lng: 102.8189,
      open: '08:00',
      close: '22:00',
      rate: 10,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 100,
      deposit: 10,
      isRec: 1,
      order: 5,
      image: '/images/lots/big-c.jpg',
      desc: 'บิ๊กซี 1 ขอนแก่น ริมถนนมิตรภาพ ลานจอดรถกว้างขวาง เข้า-ออกสะดวกสำหรับผู้มาจับจ่ายซื้อสินค้า'
    },
    {
      ownerId: ownerId,
      name: 'Lotus โนนม่วง ขอนแก่น',
      location: 'ถ.มิตรภาพ-โนนม่วง ต.ศิลา อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4758,
      lng: 102.8285,
      open: '08:00',
      close: '22:00',
      rate: 10,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 100,
      deposit: 10,
      isRec: 1,
      order: 6,
      image: '/images/lots/lotus.jpg',
      desc: 'โลตัส โนนม่วง ขอนแก่น ลานจอดรถกว้างขวาง ใกล้มหาวิทยาลัยขอนแก่น ช่องจอดได้มาตรฐานเดินทางสะดวก'
    },
    {
      ownerId: ownerId,
      name: 'ตลาดต้นตาล (Ton Tann Market)',
      location: 'ถ.มิตรภาพ ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น',
      district: 'อ.เมืองขอนแก่น',
      lat: 16.4155,
      lng: 102.8166,
      open: '16:00',
      close: '23:00',
      rate: 20,
      freeMin: 0,
      unitMin: 60,
      dailyMax: 150,
      deposit: 20,
      isRec: 1,
      order: 7,
      image: '/images/lots/tontann.jpg',
      desc: 'ตลาดนัดยามเย็นและแลนด์มาร์กสำคัญริมถนนมิตรภาพ แหล่งรวมร้านอาหาร ศิลปะ ดนตรีสด และที่จอดรถโซน A และ B'
    }
  ];

  const insertLot = db.prepare(`
    INSERT INTO ParkingLot (
      ParkingOwner_ID, LotName, Location, District, Latitude, Longitude,
      OpenTime, CloseTime, FeeRate_Per_Hour, Free_Minutes, Billing_Unit_Min,
      Daily_Max_Fee, Deposit_Amount, Is_Recommended, Recommended_Order,
      ParkingLot_Status, Image_Url, Description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'Active', ?, ?)
  `);

  const insertSlot = db.prepare(`
    INSERT INTO ParkingSlot (Lot_ID, SpaceCode, Floor, Zone, ParkingSlot_Status)
    VALUES (?, ?, ?, ?, ?)
  `);

  lots.forEach((lot, index) => {
    const res = insertLot.run(
      lot.ownerId, lot.name, lot.location, lot.district, lot.lat, lot.lng,
      lot.open, lot.close, lot.rate, lot.unitMin,
      lot.dailyMax, lot.deposit, lot.isRec, lot.order,
      lot.image, lot.desc
    );
    const lotId = Number(res.lastInsertRowid);

    if (index === 0) {
      ['B1', 'G', '2'].forEach(fl => {
        const count = fl === '2' ? 10 : 15;
        for (let i = 1; i <= count; i++) {
          insertSlot.run(lotId, `${fl}-A${String(i).padStart(2, '0')}`, fl, 'Zone A', 'Available');
        }
      });
    } else if (index === 1) {
      for (let i = 1; i <= 20; i++) {
        insertSlot.run(lotId, `1-C${String(i).padStart(2, '0')}`, 'Floor 1', 'Zone Campus', 'Available');
      }
      for (let i = 1; i <= 15; i++) {
        insertSlot.run(lotId, `OUT-B${String(i).padStart(2, '0')}`, 'Outdoor', 'Zone Park', 'Available');
      }
    } else if (index === 2) {
      for (let i = 1; i <= 15; i++) {
        insertSlot.run(lotId, `FL1-${String(i).padStart(2, '0')}`, 'Floor 1', 'North', 'Available');
        insertSlot.run(lotId, `FL2-${String(i).padStart(2, '0')}`, 'Floor 2', 'South', 'Available');
      }
    } else if (index === 3) {
      for (let i = 1; i <= 25; i++) {
        insertSlot.run(lotId, `B1-${String(i).padStart(2, '0')}`, 'B1', 'IT Zone', 'Available');
      }
    } else if (index === 4) {
      for (let i = 1; i <= 30; i++) {
        insertSlot.run(lotId, `BIG-${String(i).padStart(2, '0')}`, 'Outdoor', i <= 15 ? 'East' : 'West', 'Available');
      }
    } else if (index === 5) {
      for (let i = 1; i <= 30; i++) {
        insertSlot.run(lotId, `LOT-${String(i).padStart(2, '0')}`, 'Outdoor', i <= 15 ? 'Zone 1' : 'Zone 2', 'Available');
      }
    } else {
      for (let i = 1; i <= 20; i++) {
        insertSlot.run(lotId, `TTA-${String(i).padStart(2, '0')}`, 'Ground', 'Zone A', 'Available');
      }
      for (let i = 1; i <= 15; i++) {
        insertSlot.run(lotId, `TTB-${String(i).padStart(2, '0')}`, 'Ground', 'Zone B', 'Available');
      }
    }
  });

  db.prepare(`
    INSERT INTO FavoriteLot (Customer_ID, Lot_ID) VALUES (?, 1)
  `).run(cust1Id);

  db.prepare(`
    INSERT INTO Complaint (Customer_ID, Title, Description, Complaint_Status)
    VALUES (?, ?, ?, 'Pending')
  `).run(cust1Id, 'สอบถามเรื่องจุดชาร์จรถยนต์ไฟฟ้า EV', 'มีแผนจะติดตั้งหัวชาร์จ EV Charger เพิ่มเติมในช่องจอดของเซ็นทรัลขอนแก่นหรือไม่ครับ');

  logAudit('SYSTEM_INIT', 'Administrator', 1, 'admin', 'Database initialized: single owner owning all 7 real Khon Kaen lots without free minutes');
}

module.exports = {
  db,
  initDatabase,
  logAudit
};
