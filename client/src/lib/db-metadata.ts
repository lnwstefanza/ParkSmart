/**
 * Database Inspector Metadata for ParkSmart
 * Compatible with Relational Diagram and Oracle SQL DDL
 */

export const ENTITY_DEFINITIONS: Record<string, any> = {
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
      { name: 'Account_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Active'", isNullable: true, desc: 'สถานะบัญชี (Active, Suspended)' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: true, desc: 'วันที่สร้างบัญชี' }
    ]
  },

  Administrator: {
    entityName: 'Administrator',
    displayNameThai: 'ผู้ดูแลระบบส่วนกลาง (Administrator)',
    category: 'System Governance',
    description: 'จัดเก็บข้อมูลบัญชีผู้ดูแลระบบสูงสุด สำหรับอนุมัติลานจอด ตรวจสอบรายงาน และจัดการความปลอดภัย',
    primaryKey: 'Admin_ID',
    oracleTable: 'Administrator',
    color: 'purple',
    icon: 'ShieldCheck',
    attributes: [
      { name: 'Admin_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสผู้ดูแลระบบ' },
      { name: 'Username', oracleType: 'VARCHAR2(50)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'ชื่อผู้ใช้แอดมิน' },
      { name: 'Password_Hash', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสผ่านแฮช' },
      { name: 'FName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อจริง' },
      { name: 'LName', oracleType: 'VARCHAR2(100)', constraint: 'NOT NULL', isNullable: false, desc: 'นามสกุล' },
      { name: 'Email', oracleType: 'VARCHAR2(100)', constraint: 'UNIQUE, NOT NULL', isNullable: false, desc: 'อีเมลแอดมิน' },
      { name: 'Admin_Role', oracleType: 'VARCHAR2(50)', constraint: "DEFAULT 'SuperAdmin'", isNullable: true, desc: 'ระดับสิทธิ์ (SuperAdmin, Auditor, Support)' }
    ]
  },

  ParkingLot: {
    entityName: 'ParkingLot',
    displayNameThai: 'ข้อมูลลานจอดรถ (ParkingLot)',
    category: 'Facility & Parking Operations',
    description: 'ข้อมูลลานจอดรถในขอนแก่น พิกัด อัตราค่าบริการ เวลาเปิดปิด และนโยบายค่าปรับ',
    primaryKey: 'Lot_ID',
    oracleTable: 'ParkingLot',
    color: 'sky',
    icon: 'MapPin',
    attributes: [
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสลานจอดรถ' },
      { name: 'ParkingOwner_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Parking_Owner', isNullable: false, desc: 'รหัสเจ้าของลาน' },
      { name: 'LotName', oracleType: 'VARCHAR2(150)', constraint: 'NOT NULL', isNullable: false, desc: 'ชื่อลานจอดรถ' },
      { name: 'Location', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'ที่อยู่/สถานที่ตั้ง' },
      { name: 'District', oracleType: 'VARCHAR2(100)', constraint: '-', isNullable: true, desc: 'อำเภอ/โซน' },
      { name: 'FeeRate_Per_Hour', oracleType: 'NUMBER(8,2)', constraint: 'NOT NULL', isNullable: false, desc: 'อัตราค่าจอดต่อชั่วโมง' },
      { name: 'OpenTime', oracleType: 'VARCHAR2(10)', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาเปิดบริการ' },
      { name: 'CloseTime', oracleType: 'VARCHAR2(10)', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาปิดบริการ' },
      { name: 'ParkingLot_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Active'", isNullable: true, desc: 'สถานะลาน (Active, Pending, Rejected, Suspended)' }
    ]
  },

  ParkingSlot: {
    entityName: 'ParkingSlot',
    displayNameThai: 'ข้อมูลช่องจอดรถ (ParkingSlot)',
    category: 'Facility & Parking Operations',
    description: 'ข้อมูลช่องจอดรถแต่ละช่องในแต่ละชั้นและโซน พร้อมสถานะความพร้อมแบบ Real-time',
    primaryKey: 'Slot_ID',
    oracleTable: 'ParkingSlot',
    color: 'blue',
    icon: 'Car',
    attributes: [
      { name: 'Slot_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสช่องจอดรถ' },
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> ParkingLot', isNullable: false, desc: 'รหัสลานจอด' },
      { name: 'SpaceCode', oracleType: 'VARCHAR2(20)', constraint: 'NOT NULL', isNullable: false, desc: 'รหัสช่อง เช่น A-01, B-12' },
      { name: 'Floor', oracleType: 'VARCHAR2(10)', constraint: '-', isNullable: true, desc: 'ชั้นของช่องจอด' },
      { name: 'Zone', oracleType: 'VARCHAR2(20)', constraint: '-', isNullable: true, desc: 'โซนพื้นที่' },
      { name: 'ParkingSlot_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Available'", isNullable: false, desc: 'สถานะช่อง (Available, Reserved, Occupied, Maintenance)' }
    ]
  },

  Reservation: {
    entityName: 'Reservation',
    displayNameThai: 'หัวรายการจอง (Reservation Header)',
    category: 'Booking & Transactions',
    description: 'เอกสารหัวบิลการจองช่องจอดรถ ผูกกับลูกค้าและบันทึกเวลาทำรายการ',
    primaryKey: 'Booking_ID',
    oracleTable: 'Reservation',
    color: 'indigo',
    icon: 'Calendar',
    attributes: [
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสการจอง' },
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Customer', isNullable: false, desc: 'รหัสลูกค้าผู้จอง' },
      { name: 'BookingDate', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: false, desc: 'วันเวลาที่ทำรายการจอง' }
    ]
  },

  Reservation_Detail: {
    entityName: 'Reservation_Detail',
    displayNameThai: 'รายละเอียดการจอง (Reservation_Detail)',
    category: 'Booking & Transactions',
    description: 'รายละเอียดการจองแต่ละช่อง ทะเบียนรถ ช่วงเวลา ค่าบริการ ค่าปรับ สถานะ และ QRToken',
    primaryKey: 'Detail_ID',
    oracleTable: 'Reservation_Detail',
    color: 'cyan',
    icon: 'CreditCard',
    attributes: [
      { name: 'Detail_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสรายละเอียดการจอง' },
      { name: 'Booking_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation', isNullable: false, desc: 'รหัสหัวการจอง' },
      { name: 'Slot_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> ParkingSlot', isNullable: false, desc: 'รหัสช่องจอด' },
      { name: 'LicensePlate', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'ทะเบียนรถยนต์ที่จอง' },
      { name: 'Expected_Arrival', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาที่กำหนดเข้าจอด' },
      { name: 'Booked_Hours', oracleType: 'NUMBER(4,1)', constraint: 'NOT NULL', isNullable: false, desc: 'จำนวนชั่วโมงที่จอง' },
      { name: 'Booked_End', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาสิ้นสุดการจอง' },
      { name: 'Reservation_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Pending_Payment'", isNullable: false, desc: 'สถานะการจอง (Pending_Payment, Confirmed, Checked_In, Completed, Cancelled)' },
      { name: 'QRToken', oracleType: 'VARCHAR2(100)', constraint: 'UNIQUE', isNullable: true, desc: 'รหัส QR Code สำหรับสแกนเข้าออก' }
    ]
  },

  UsageLog: {
    entityName: 'UsageLog',
    displayNameThai: 'บันทึกการเข้าออกจริง (UsageLog)',
    category: 'Booking & Transactions',
    description: 'บันทึกเวลาสแกนเข้าและสแกนออกจากสถานที่จริง พร้อมคำนวณระยะเวลาการจอดและชั่วโมงเกินเวลา',
    primaryKey: 'Log_ID',
    oracleTable: 'UsageLog',
    color: 'teal',
    icon: 'Clock',
    attributes: [
      { name: 'Log_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสประวัติการเข้าจอด' },
      { name: 'Detail_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation_Detail', isNullable: false, desc: 'รหัสรายการจอง' },
      { name: 'Actual_Check_In', oracleType: 'TIMESTAMP', constraint: 'NOT NULL', isNullable: false, desc: 'เวลาสแกนเข้าจริง' },
      { name: 'Actual_Check_Out', oracleType: 'TIMESTAMP', constraint: '-', isNullable: true, desc: 'เวลาสแกนออกจริง' },
      { name: 'Overtime_Minutes', oracleType: 'NUMBER(8)', constraint: 'DEFAULT 0', isNullable: true, desc: 'จำนวนนาทีที่จอดเกินเวลา' }
    ]
  },

  Payment: {
    entityName: 'Payment',
    displayNameThai: 'รายการชำระเงินและค่าปรับ (Payment)',
    category: 'Billing & Payments',
    description: 'บันทึกธุรกรรมการชำระเงินค่าจอดล่วงหน้า ค่าปรับมาสาย และค่าปรับจอดเกินเวลา 2 เท่า',
    primaryKey: 'Payment_ID',
    oracleTable: 'Payment',
    color: 'rose',
    icon: 'DollarSign',
    attributes: [
      { name: 'Payment_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสการชำระเงิน' },
      { name: 'Detail_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Reservation_Detail', isNullable: false, desc: 'รหัสรายการจอง' },
      { name: 'Amount', oracleType: 'NUMBER(10,2)', constraint: 'NOT NULL', isNullable: false, desc: 'ยอดเงินที่ชำระ (บาท)' },
      { name: 'Payment_Type', oracleType: 'VARCHAR2(30)', constraint: 'NOT NULL', isNullable: false, desc: 'ประเภทการชำระ (Deposit, Overtime_Penalty, Total)' },
      { name: 'Payment_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Paid'", isNullable: false, desc: 'สถานะการจ่ายเงิน (Paid, Pending, Refunded)' },
      { name: 'Payment_Date', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: false, desc: 'วันเวลาที่ชำระ' }
    ]
  },

  Complaint: {
    entityName: 'Complaint',
    displayNameThai: 'การร้องเรียนและข้อเสนอแนะ (Complaint)',
    category: 'Support & Service',
    description: 'การแจ้งปัญหาและข้อเสนอแนะจากผู้ใช้ พร้อมการตอบกลับและแก้ไขโดยผู้ดูแลระบบ',
    primaryKey: 'Complaint_ID',
    oracleTable: 'Complaint',
    color: 'orange',
    icon: 'MessageSquareWarning',
    attributes: [
      { name: 'Complaint_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัสเรื่องร้องเรียน' },
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Customer', isNullable: false, desc: 'รหัสลูกค้าผู้ร้องเรียน' },
      { name: 'Topic', oracleType: 'VARCHAR2(200)', constraint: 'NOT NULL', isNullable: false, desc: 'หัวข้อปัญหา' },
      { name: 'Description', oracleType: 'CLOB', constraint: 'NOT NULL', isNullable: false, desc: 'รายละเอียดของปัญหา' },
      { name: 'Complaint_Status', oracleType: 'VARCHAR2(20)', constraint: "DEFAULT 'Pending'", isNullable: false, desc: 'สถานะ (Pending, In_Progress, Resolved, Rejected)' }
    ]
  },

  AuditLog: {
    entityName: 'AuditLog',
    displayNameThai: 'บันทึกกิจกรรมความปลอดภัย (AuditLog)',
    category: 'System Governance',
    description: 'บันทึกประวัติการเปลี่ยนแปลงข้อมูลสำคัญในระบบ ป้องกันการทุจริตและตรวจสอบย้อนหลัง',
    primaryKey: 'Audit_ID',
    oracleTable: 'AuditLog',
    color: 'slate',
    icon: 'FileText',
    attributes: [
      { name: 'Audit_ID', oracleType: 'VARCHAR2(10)', constraint: 'PK', isNullable: false, desc: 'รหัส Audit Log' },
      { name: 'Action', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'การกระทำ เช่น CREATE_BOOKING, CHECK_IN' },
      { name: 'Performer_Role', oracleType: 'VARCHAR2(50)', constraint: 'NOT NULL', isNullable: false, desc: 'บทบาทผู้กระทำ' },
      { name: 'Description', oracleType: 'VARCHAR2(255)', constraint: 'NOT NULL', isNullable: false, desc: 'รายละเอียดกิจกรรม' },
      { name: 'Created_At', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: false, desc: 'วันเวลา' }
    ]
  },

  FavoriteLot: {
    entityName: 'FavoriteLot',
    displayNameThai: 'ลานจอดที่ถูกใจ (FavoriteLot)',
    category: 'User Management',
    description: 'บันทึกลานจอดที่ผู้ใช้กดติดตามเพื่อความสะดวกในการจองครั้งถัดไป',
    primaryKey: 'Favorite_ID',
    oracleTable: 'FavoriteLot',
    color: 'pink',
    icon: 'Heart',
    attributes: [
      { name: 'Favorite_ID', oracleType: 'VARCHAR2(30)', constraint: 'PK', isNullable: false, desc: 'รหัสการบันทึกลานโปรด' },
      { name: 'Customer_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> Customer', isNullable: false, desc: 'รหัสลูกค้า' },
      { name: 'Lot_ID', oracleType: 'VARCHAR2(10)', constraint: 'FK -> ParkingLot', isNullable: false, desc: 'รหัสลานจอด' },
      { name: 'Saved_Date', oracleType: 'TIMESTAMP', constraint: 'DEFAULT CURRENT_TIMESTAMP', isNullable: false, desc: 'วันที่กดบันทึก' }
    ]
  }
};

export const ER_RELATIONSHIPS = [
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'Reservation', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้าหนึ่งคนสามารถจองได้หลายครั้ง' },
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'Complaint', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้าร้องเรียนได้หลายเรื่อง' },
  { fromTable: 'Customer', fromCol: 'Customer_ID', toTable: 'FavoriteLot', toCol: 'Customer_ID', relation: '1:N', desc: 'ลูกค้าบันทึกลานโปรดได้หลายลาน' },
  { fromTable: 'Parking_Owner', fromCol: 'ParkingOwner_ID', toTable: 'ParkingLot', toCol: 'ParkingOwner_ID', relation: '1:N', desc: 'เจ้าของหนึ่งคนสามารถเป็นเจ้าของได้หลายลาน' },
  { fromTable: 'ParkingLot', fromCol: 'Lot_ID', toTable: 'ParkingSlot', toCol: 'Lot_ID', relation: '1:N', desc: 'ลานจอดหนึ่งแห่งประกอบด้วยหลายช่องจอด' },
  { fromTable: 'ParkingSlot', fromCol: 'Slot_ID', toTable: 'Reservation_Detail', toCol: 'Slot_ID', relation: '1:N', desc: 'ช่องจอดถูกจองได้หลายช่วงเวลา' },
  { fromTable: 'Reservation', fromCol: 'Booking_ID', toTable: 'Reservation_Detail', toCol: 'Booking_ID', relation: '1:N', desc: 'การจองประกอบด้วยรายละเอียดช่องจอด' },
  { fromTable: 'Reservation_Detail', fromCol: 'Detail_ID', toTable: 'UsageLog', toCol: 'Detail_ID', relation: '1:1', desc: 'รายการจองมีการบันทึกเวลาเข้าออกจริง 1 บันทึก' },
  { fromTable: 'Reservation_Detail', fromCol: 'Detail_ID', toTable: 'Payment', toCol: 'Detail_ID', relation: '1:N', desc: 'รายการจองผูกกับการชำระเงินมัดจำและค่าปรับ' }
];

export const DATA_FLOW_STAGES = [
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

export const ORACLE_SQL_DDL = `-- ===============================================================
-- Database Course Project: ParkSmart Relational Database Schema
-- Standard Oracle SQL DDL / Relational Diagram Compliant
-- File: parksmart_schema.sql
-- ===============================================================

CREATE TABLE Customer (
  Customer_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Phone_Number VARCHAR2(15) UNIQUE NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Account_Status VARCHAR2(20) DEFAULT 'Active',
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Parking_Owner (
  ParkingOwner_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Phone_Number VARCHAR2(15) UNIQUE NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Bank_Account VARCHAR2(50) NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Administrator (
  Admin_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Admin_Role VARCHAR2(50) DEFAULT 'SuperAdmin'
);

CREATE TABLE ParkingLot (
  Lot_ID VARCHAR2(10) PRIMARY KEY,
  ParkingOwner_ID VARCHAR2(10) NOT NULL REFERENCES Parking_Owner(ParkingOwner_ID),
  LotName VARCHAR2(150) NOT NULL,
  Location VARCHAR2(255) NOT NULL,
  District VARCHAR2(100),
  FeeRate_Per_Hour NUMBER(8,2) NOT NULL,
  OpenTime VARCHAR2(10) NOT NULL,
  CloseTime VARCHAR2(10) NOT NULL,
  ParkingLot_Status VARCHAR2(20) DEFAULT 'Active'
);

CREATE TABLE ParkingSlot (
  Slot_ID VARCHAR2(10) PRIMARY KEY,
  Lot_ID VARCHAR2(10) NOT NULL REFERENCES ParkingLot(Lot_ID),
  SpaceCode VARCHAR2(20) NOT NULL,
  Floor VARCHAR2(10),
  Zone VARCHAR2(20),
  ParkingSlot_Status VARCHAR2(20) DEFAULT 'Available'
);

CREATE TABLE Reservation (
  Booking_ID VARCHAR2(10) PRIMARY KEY,
  Customer_ID VARCHAR2(10) NOT NULL REFERENCES Customer(Customer_ID),
  BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reservation_Detail (
  Detail_ID VARCHAR2(10) PRIMARY KEY,
  Booking_ID VARCHAR2(10) NOT NULL REFERENCES Reservation(Booking_ID),
  Slot_ID VARCHAR2(10) NOT NULL REFERENCES ParkingSlot(Slot_ID),
  LicensePlate VARCHAR2(50) NOT NULL,
  Expected_Arrival TIMESTAMP NOT NULL,
  Booked_Hours NUMBER(4,1) NOT NULL,
  Booked_End TIMESTAMP NOT NULL,
  Reservation_Status VARCHAR2(20) DEFAULT 'Pending_Payment',
  QRToken VARCHAR2(100) UNIQUE
);

CREATE TABLE UsageLog (
  Log_ID VARCHAR2(10) PRIMARY KEY,
  Detail_ID VARCHAR2(10) NOT NULL REFERENCES Reservation_Detail(Detail_ID),
  Actual_Check_In TIMESTAMP NOT NULL,
  Actual_Check_Out TIMESTAMP,
  Overtime_Minutes NUMBER(8) DEFAULT 0
);

CREATE TABLE Payment (
  Payment_ID VARCHAR2(10) PRIMARY KEY,
  Detail_ID VARCHAR2(10) NOT NULL REFERENCES Reservation_Detail(Detail_ID),
  Amount NUMBER(10,2) NOT NULL,
  Payment_Type VARCHAR2(30) NOT NULL,
  Payment_Status VARCHAR2(20) DEFAULT 'Paid',
  Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Complaint (
  Complaint_ID VARCHAR2(10) PRIMARY KEY,
  Customer_ID VARCHAR2(10) NOT NULL REFERENCES Customer(Customer_ID),
  Topic VARCHAR2(200) NOT NULL,
  Description CLOB NOT NULL,
  Complaint_Status VARCHAR2(20) DEFAULT 'Pending'
);

CREATE TABLE AuditLog (
  Audit_ID VARCHAR2(10) PRIMARY KEY,
  Action VARCHAR2(50) NOT NULL,
  Performer_Role VARCHAR2(50) NOT NULL,
  Description VARCHAR2(255) NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
