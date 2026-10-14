/**
 * Entity & Attribute Definitions for Database Project
 * Contains schemas, data dictionaries, relationships, and user journey flow mappings.
 */

const ENTITY_DEFINITIONS = {
  Customer: {
    entityName: 'Customer',
    displayNameThai: 'ข้อมูลผู้ใช้งาน (Customer)',
    category: 'User Management',
    description: 'จัดเก็บข้อมูลบัญชีผู้ใช้ทั่วไป (ลูกค้า) ที่เข้ามาค้นหาและจองช่องจอดรถในระบบ',
    primaryKey: 'Customer_ID',
    oracleTable: 'Customer',
    color: 'emerald',
    icon: 'User',
    attributes: [
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสประจำตัวลูกค้า (Primary Key)' },
      { name: 'Username', oracleType: 'VARCHAR2(50)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ' },
      { name: 'Password_Hash', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสผ่านที่ผ่านการเข้ารหัส bcrypt เพื่อความปลอดภัย' },
      { name: 'FName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อจริงของลูกค้า' },
      { name: 'LName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'นามสกุลของลูกค้า' },
      { name: 'Phone_Number', oracleType: 'VARCHAR2(15)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'เบอร์โทรศัพท์ติดต่อ' },
      { name: 'Email', oracleType: 'VARCHAR2(100)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'อีเมลสำหรับรับการแจ้งเตือน' },
      { name: 'Account_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Active'", isNullable: true, desc: 'สถานะบัญชี (Active, Suspended, Inactive)' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันและเวลาที่สมัครสมาชิก' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างระเบียนข้อมูล (SYSTEM / Self)' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันและเวลาที่อัปเดตข้อมูลล่าสุด' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้แก้ไขระเบียนข้อมูลล่าสุด' }
    ]
  },

  Parking_Owner: {
    entityName: 'Parking_Owner',
    displayNameThai: 'เจ้าของลานจอดรถ (Parking_Owner)',
    category: 'User Management',
    description: 'จัดเก็บข้อมูลบัญชีเจ้าของลานจอดรถ ผู้มีสิทธิ์จัดการลาน ช่องจอด และรับส่วนแบ่งรายได้',
    primaryKey: 'ParkingOwner_ID',
    oracleTable: 'Parking_Owner',
    color: 'amber',
    icon: 'Building2',
    attributes: [
      { name: 'ParkingOwner_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสเจ้าของลานจอดรถ (Primary Key)' },
      { name: 'Username', oracleType: 'VARCHAR2(50)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบของเจ้าของลาน' },
      { name: 'Password_Hash', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสผ่านแฮช' },
      { name: 'FName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อจริง' },
      { name: 'LName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'นามสกุล' },
      { name: 'Phone_Number', oracleType: 'VARCHAR2(15)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'เบอร์โทรศัพท์ติดต่อธุรกิจ' },
      { name: 'Email', oracleType: 'VARCHAR2(100)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'อีเมลเจ้าของลาน' },
      { name: 'Bank_Account', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'เลขบัญชีธนาคารสำหรับรับโอนเงินค่าจอดรถ' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่สร้างบัญชี' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างระเบียน' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันที่แก้ไขข้อมูลล่าสุด' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้แก้ไขข้อมูลล่าสุด' }
    ]
  },

  Administrator: {
    entityName: 'Administrator',
    displayNameThai: 'ผู้ดูแลระบบ (Administrator)',
    category: 'User Management',
    description: 'จัดเก็บข้อมูลบัญชีเจ้าหน้าที่ผู้ดูแลระบบสูงสุด ตรวจสอบลาน จัดการสมาชิก และตอบข้อร้องเรียน',
    primaryKey: 'Admin_ID',
    oracleTable: 'Administrator',
    color: 'purple',
    icon: 'ShieldCheck',
    attributes: [
      { name: 'Admin_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสแอดมินผู้ดูแลระบบ (Primary Key)' },
      { name: 'Username', oracleType: 'VARCHAR2(50)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'ชื่อผู้ใช้แอดมิน' },
      { name: 'Password_Hash', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสผ่านแฮช' },
      { name: 'FName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อจริง' },
      { name: 'LName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'นามสกุล' },
      { name: 'Email', oracleType: 'VARCHAR2(100)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'อีเมลแอดมิน' },
      { name: 'Phone_Number', oracleType: 'VARCHAR2(15)', constraint: 'NOT NULL', isNullable: false, desc: 'เบอร์โทรศัพท์' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่สร้างบัญชี' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้าง' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันที่แก้ไข' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้แก้ไข' }
    ]
  },

  ParkingLot: {
    entityName: 'ParkingLot',
    displayNameThai: 'ลานจอดรถ (ParkingLot)',
    category: 'Parking Management',
    description: 'จัดเก็บข้อมูลลานจอดรถหรืออาคารจอดรถ ที่ตั้ง อัตราค่าบริการ และเวลาเปิด-ปิด',
    primaryKey: 'Lot_ID',
    oracleTable: 'ParkingLot',
    color: 'sky',
    icon: 'MapPin',
    attributes: [
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสลานจอดรถ (Primary Key)' },
      { name: 'ParkingOwner_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Parking_Owner', isNullable: false, desc: 'รหัสเจ้าของลานจอด (Foreign Key)' },
      { name: 'LotName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อลานจอดรถ เช่น Central Khonkaen' },
      { name: 'Location', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'ที่อยู่ / พิกัดที่ตั้ง' },
      { name: 'OpenTime', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาเปิดให้บริการ เช่น 10:00' },
      { name: 'CloseTime', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาปิดให้บริการ เช่น 22:00' },
      { name: 'FeeRate', oracleType: 'NUMBER(10,2)', constraint: 'NOT NULL', isNullable: false, desc: 'อัตราค่าบริการต่อชั่วโมง (บาท)' },
      { name: 'ParkingLot_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Active'", isNullable: true, desc: 'สถานะลานจอด (Active, Maintenance, Closed)' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่เพิ่มลานเข้าสู่ระบบ' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างระเบียน' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันที่อัปเดตข้อมูล' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้อัปเดตข้อมูล' }
    ]
  },

  ParkingSlot: {
    entityName: 'ParkingSlot',
    displayNameThai: 'ช่องจอดรถ (ParkingSlot)',
    category: 'Parking Management',
    description: 'จัดเก็บข้อมูลช่องจอดแต่ละช่อง ชั้น โซน และสถานะว่าง/ติดจอง/มีรถจอด',
    primaryKey: 'Slot_ID',
    oracleTable: 'ParkingSlot',
    color: 'blue',
    icon: 'Layers',
    attributes: [
      { name: 'Slot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสช่องจอดรถ (Primary Key)' },
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> ParkingLot (CASCADE)', isNullable: false, desc: 'รหัสลานจอดที่สังกัด (Foreign Key)' },
      { name: 'SpaceCode', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสโค้ดช่องจอด เช่น 1-A01, 1-C03' },
      { name: 'Floor', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ชั้นที่ตั้งช่องจอด เช่น Floor 1, Ground' },
      { name: 'Zone', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'โซนพื้นที่ เช่น Zone A, Zone VIP' },
      { name: 'ParkingSlot_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Available'", isNullable: true, desc: 'สถานะปัจจุบัน (Available, Reserved, Occupied, Maintenance)' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่สร้างช่องจอด' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้าง' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันที่อัปเดตสถานะ' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้อัปเดตสถานะ' }
    ]
  },

  FavoriteLot: {
    entityName: 'FavoriteLot',
    displayNameThai: 'ลานจอดที่บันทึกไว้ (FavoriteLot)',
    category: 'Booking & Transactions',
    description: 'จัดเก็บรายการลานจอดรถที่ลูกค้ากดถูกใจไว้ (Bookmark) เพื่อความสะดวกในการจองซ้ำ',
    primaryKey: 'Customer_ID, Lot_ID (Composite PK)',
    oracleTable: 'FavoriteLot',
    color: 'rose',
    icon: 'Heart',
    attributes: [
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK, FK -> Customer', isNullable: false, desc: 'รหัสลูกค้า (Foreign Key & Part of PK)' },
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK, FK -> ParkingLot', isNullable: false, desc: 'รหัสลานจอดรถที่บันทึก (Foreign Key & Part of PK)' },
      { name: 'Saved_Date', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่และเวลาที่กดบันทึกเป็นลานโปรด' }
    ]
  },

  Reservation: {
    entityName: 'Reservation',
    displayNameThai: 'ธุรกรรมการจอง (Reservation)',
    category: 'Booking & Transactions',
    description: 'จัดเก็บหัวข้อธุรกรรมการจอง (Booking Header) เชื่อมโยงลูกค้าและวันที่ทำรายการจอง',
    primaryKey: 'Booking_ID',
    oracleTable: 'Reservation',
    color: 'indigo',
    icon: 'Calendar',
    attributes: [
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสธุรกรรมการจอง (Primary Key)' },
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Customer', isNullable: false, desc: 'รหัสลูกค้าผู้ทำรายการจอง (Foreign Key)' },
      { name: 'ReserveDate', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'วันที่ทำรายการจอง' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'เวลาสร้างรายการในระบบ' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างรายการ (Customer)' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาอัปเดตล่าสุด' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้อัปเดตล่าสุด' }
    ]
  },

  Reservation_Detail: {
    entityName: 'Reservation_Detail',
    displayNameThai: 'รายละเอียดการจอง (Reservation_Detail)',
    category: 'Booking & Transactions',
    description: 'จัดเก็บรายละเอียดสำคัญของการจอง ช่องจอด ทะเบียนรถ ช่วงเวลา ค่าบริการ E-Ticket QRToken และสถานะการจอง',
    primaryKey: 'Booking_ID, Slot_ID (Composite PK)',
    oracleTable: 'Reservation_Detail',
    color: 'violet',
    icon: 'Ticket',
    attributes: [
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK, FK -> Reservation', isNullable: false, desc: 'รหัสการจอง (Foreign Key)' },
      { name: 'Slot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK, FK -> ParkingSlot', isNullable: false, desc: 'รหัสช่องจอดที่จอง (Foreign Key)' },
      { name: 'LicensePlate', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'หมายเลขทะเบียนรถของผู้ใช้ เช่น กข 9999 ขอนแก่น' },
      { name: 'StartTime', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาเริ่มต้นจองที่คาดว่าจะมาถึง (Expected_Arrival)' },
      { name: 'EndTime', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาสิ้นสุดการจองที่ต้องออกจากช่องจอด (Booked_End)' },
      { name: 'Totalfee', oracleType: 'NUMBER(10,2)', constraint: 'NOT NULL', isNullable: false, desc: 'ยอดค่าบริการรวมทั้งหมด (บาท)' },
      { name: 'Reservation_Status', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'สถานะการจอง (Pending_Payment, Confirmed, Checked_In, Completed, Cancelled)' },
      { name: 'QRToken', oracleType: 'VARCHAR2(255)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'รหัสโทเค็น QR Code สำหรับสแกนเข้า-ออกลานจอด (E-Ticket)' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่สร้างข้อมูล' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างข้อมูล' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันที่อัปเดตข้อมูล' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้อัปเดตข้อมูล' }
    ]
  },

  UsageLog: {
    entityName: 'UsageLog',
    displayNameThai: 'ประวัติการเข้า-ออกจริง (UsageLog)',
    category: 'Booking & Transactions',
    description: 'จัดเก็บบันทึกเวลาที่รถยนต์เข้าจอดจริงและออกจากช่องจอดจริงผ่านการสแกน QR Code',
    primaryKey: 'Log_ID',
    oracleTable: 'UsageLog',
    color: 'teal',
    icon: 'Clock',
    attributes: [
      { name: 'Log_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสบันทึกการใช้งาน (Primary Key)' },
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation_Detail', isNullable: false, desc: 'รหัสการจองที่เกี่ยวข้อง' },
      { name: 'Slot_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation_Detail', isNullable: false, desc: 'รหัสช่องจอดที่ใช้งาน' },
      { name: 'Actual_Check_In', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาที่สแกนเช็คอินเข้าจอดจริง' },
      { name: 'Actual_Check_Out', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาที่สแกนเช็คเอาท์ออกจากลานจริง' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'เวลาที่บันทึกข้อมูล' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างบันทึก' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาที่แก้ไขบันทึก' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้แก้ไขบันทึก' }
    ]
  },

  Payment: {
    entityName: 'Payment',
    displayNameThai: 'ธุรกรรมการเงิน (Payment)',
    category: 'Finance & Support',
    description: 'จัดเก็บประวัติการชำระเงินค่ามัดจำ ค่าจอดรถ และค่าปรับจอดเกินเวลา',
    primaryKey: 'Payment_ID',
    oracleTable: 'Payment',
    color: 'emerald',
    icon: 'CreditCard',
    attributes: [
      { name: 'Payment_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสธุรกรรมการชำระเงิน (Primary Key)' },
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation', isNullable: false, desc: 'รหัสการจองที่ทำการชำระเงิน (Foreign Key)' },
      { name: 'Amount', oracleType: 'NUMBER(10,2)', constraint: 'NOT NULL', isNullable: false, desc: 'จำนวนเงินที่ชำระ (บาท)' },
      { name: 'Payment_Type', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'ประเภทการชำระ (Deposit, Full_Payment, Overtime_Penalty, Late_Penalty)' },
      { name: 'Payment_Method', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'ช่องทางชำระเงิน (PromptPay, Credit_Card, Cash)' },
      { name: 'Payment_Status', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'สถานะการชำระ (Completed, Pending, Failed)' },
      { name: 'Payment_Date', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันและเวลาที่ทำรายการชำระเงิน' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันเวลาที่บันทึก' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้างรายการ' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'วันเวลาที่อัปเดต' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้อัปเดตรายการ' }
    ]
  },

  Complaint: {
    entityName: 'Complaint',
    displayNameThai: 'ข้อร้องเรียน (Complaint)',
    category: 'Finance & Support',
    description: 'จัดเก็บเรื่องร้องเรียนหรือข้อเสนอแนะจากลูกค้า และการดำเนินการตอบกลับของแอดมิน',
    primaryKey: 'Complaint_ID',
    oracleTable: 'Complaint',
    color: 'rose',
    icon: 'AlertCircle',
    attributes: [
      { name: 'Complaint_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสข้อร้องเรียน (Primary Key)' },
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation', isNullable: false, desc: 'รหัสการจองที่เกี่ยวข้อง (ถ้ามี)' },
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Customer', isNullable: false, desc: 'รหัสลูกค้าผู้ส่งเรื่องร้องเรียน (Foreign Key)' },
      { name: 'Admin_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Administrator', isNullable: true, desc: 'รหัสแอดมินผู้รับผิดชอบตอบกลับ (Foreign Key)' },
      { name: 'Title', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'หัวข้อเรื่องร้องเรียน' },
      { name: 'Description', oracleType: 'CLOB', constraint: 'NOT NULL', isNullable: false, desc: 'รายละเอียดเนื้อหาข้อร้องเรียน' },
      { name: 'Complaint_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Pending'", isNullable: true, desc: 'สถานะเรื่องร้องเรียน (Pending, In_Progress, Resolved)' },
      { name: 'Complaint_Date', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่และเวลาที่ส่งข้อร้องเรียน' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'เวลาสร้าง' },
      { name: 'Created_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้สร้าง' },
      { name: 'Updated_At', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาแก้ไข' },
      { name: 'Updated_By', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ผู้แก้ไข' }
    ]
  },

  AuditLog: {
    entityName: 'AuditLog',
    displayNameThai: 'ประวัติกิจกรรมระบบ (AuditLog)',
    category: 'User Management',
    description: 'เก็บบันทึกประวัติกิจกรรมสำคัญและการตรวจสอบความปลอดภัยของระบบ (Security Trail)',
    primaryKey: 'Audit_ID',
    oracleTable: 'AuditLog',
    color: 'slate',
    icon: 'Shield',
    attributes: [
      { name: 'Audit_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสบันทึกกิจกรรม (Primary Key)' },
      { name: 'Action', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'การกระทำ เช่น LOGIN, BOOKING, CHECK_IN' },
      { name: 'User_Type', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'บทบาทผู้ใช้ (Customer, Owner, Admin)' },
      { name: 'User_ID', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'รหัสผู้กระทำ' },
      { name: 'Username', oracleType: 'VARCHAR2(50)', constraint: '-', isNullable: true, desc: 'ชื่อผู้ใช้' },
      { name: 'Details', oracleType: 'CLOB', constraint: '-', isNullable: true, desc: 'รายละเอียดเพิ่มเติม' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'เวลาที่เกิดกิจกรรม' }
    ]
  }
};

const ER_RELATIONSHIPS = [
  { fromTable: 'Parking_Owner', fromCol: 'ParkingOwner_ID', toTable: 'ParkingLot', toCol: 'ParkingOwner_ID', relation: '1:N', desc: 'เจ้าของลานจอด 1 คน เป็นเจ้าของได้หลายลานจอด' },
  { fromTable: 'ParkingLot', fromCol: 'Lot_ID', toTable: 'ParkingSlot', toCol: 'Lot_ID', relation: '1:N', desc: 'ลานจอด 1 แห่ง ประกอบด้วยช่องจอดรถหลายช่อง (CASCADE)' },
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'FavoriteLot', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้า 1 คน สามารถบันทึกลานโปรดได้หลายลาน (CASCADE)' },
  { fromTable: 'ParkingLot', fromCol: 'Lot_ID', toTable: 'FavoriteLot', toCol: 'Lot_ID', relation: '1:N', desc: 'ลานจอดรถถูกบันทึกเป็นลานโปรดได้โดยลูกค้าหลายคน (CASCADE)' },
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'Reservation', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้า 1 คน สามารถสร้างรายการจองได้หลายครั้ง' },
  { fromTable: 'Reservation', fromCol: 'Booking_ID', toTable: 'Reservation_Detail', toCol: 'Booking_ID', relation: '1:N', desc: 'ธุรกรรมการจอง 1 รายการ มีรายละเอียดช่องจอดและเวลา (CASCADE)' },
  { fromTable: 'ParkingSlot', fromCol: 'Slot_ID', toTable: 'Reservation_Detail', toCol: 'Slot_ID', relation: '1:N', desc: 'ช่องจอดรถถูกเลือกจองตามช่วงเวลาในรายละเอียดการจอง' },
  { fromTable: 'Reservation_Detail', fromCol: 'Booking_ID, Slot_ID', toTable: 'UsageLog', toCol: 'Booking_ID, Slot_ID', relation: '1:N', desc: 'การจองแต่ละครั้งมีบันทึกเวลาสแกนเข้า-ออกจริง (CASCADE)' },
  { fromTable: 'Reservation', fromCol: 'Booking_ID', toTable: 'Payment', toCol: 'Booking_ID', relation: '1:N', desc: 'การจอง 1 รายการ มีการชำระเงินค่ามัดจำ/ค่าบริการ/ค่าปรับ' },
  { fromTable: 'Reservation', fromCol: 'Booking_ID', toTable: 'Complaint', toCol: 'Booking_ID', relation: '1:N', desc: 'การจองสามารถเชื่อมโยงกับข้อร้องเรียนที่เกิดขึ้น' },
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'Complaint', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้า 1 คน สามารถส่งข้อร้องเรียนได้หลายเรื่อง' },
  { fromTable: 'Administrator', fromCol: 'Admin_ID', toTable: 'Complaint', toCol: 'Admin_ID', relation: '1:N', desc: 'แอดมิน 1 คน สามารถตรวจสอบและตอบกลับข้อร้องเรียน' }
];

const DATA_FLOW_STAGES = [
  {
    role: 'Customer (ผู้ใช้งาน/ลูกค้า)',
    title: '1. ค้นหาและบันทึกลานจอดโปรด',
    entities: ['Customer', 'ParkingLot', 'FavoriteLot'],
    description: 'ลูกค้าเข้าสู่ระบบและกดบันทึกลานจอดที่ใช้งานบ่อยลงใน FavoriteLot เพื่อดูสถานะแบบรวดเร็ว'
  },
  {
    role: 'Customer (ผู้ใช้งาน/ลูกค้า)',
    title: '2. ทำการจองและชำระเงินมัดจำ',
    entities: ['Reservation', 'Reservation_Detail', 'Payment', 'ParkingSlot'],
    description: 'เลือกลานจอด วันที่ เวลาจอด ระบบสร้าง Booking_ID ใน Reservation และบันทึกช่องจอด ทะเบียนรถ ใน Reservation_Detail พร้อมสร้าง QRToken สำหรับ E-Ticket และบันทึก Payment สถานะ Confirmed'
  },
  {
    role: 'Customer & Parking_Owner',
    title: '3. การเช็คอินเข้าจอดจริง (Check-in via QR)',
    entities: ['UsageLog', 'Reservation_Detail', 'ParkingSlot'],
    description: 'ลูกค้ามาถึงลานจอด สแกน QR Code เข้าจอด ระบบบันทึก Actual_Check_In ลงใน UsageLog เปลี่ยนสถานะใน Reservation_Detail เป็น Checked_In และเปลี่ยนสถานะ ParkingSlot เป็น Occupied'
  },
  {
    role: 'Customer & Parking_Owner',
    title: '4. การเช็คเอาท์และคิดค่าปรับ (Check-out & Overtime)',
    entities: ['UsageLog', 'Reservation_Detail', 'Payment', 'ParkingSlot'],
    description: 'เมื่อออกจากลาน สแกน QR Code บันทึก Actual_Check_Out ใน UsageLog หากจอดเกินเวลาคำนวณ Overtime_Penalty 2 เท่า บันทึก Payment ส่วนเพิ่ม และคืนสถานะ ParkingSlot เป็น Available'
  },
  {
    role: 'Parking_Owner (เจ้าของลาน)',
    title: '5. การบริหารจัดการลานและติดตามรายได้',
    entities: ['Parking_Owner', 'ParkingLot', 'ParkingSlot', 'Payment'],
    description: 'เจ้าของลานตรวจสอบจำนวนช่องจอดว่าง/ไม่ว่าง ตรวจสอบผู้เช็คอิน และดูรายงานรายได้จากการจอง'
  },
  {
    role: 'Customer & Admin',
    title: '6. การแจ้งและแก้ไขข้อร้องเรียน',
    entities: ['Complaint', 'Customer', 'Administrator'],
    description: 'ลูกค้าส่งข้อร้องเรียนผ่านหน้าร้องเรียน แอดมินตรวจสอบ ตอบกลับข้อความ และเปลี่ยนสถานะเป็น Resolved'
  }
];

module.exports = {
  ENTITY_DEFINITIONS,
  ER_RELATIONSHIPS,
  DATA_FLOW_STAGES
};
