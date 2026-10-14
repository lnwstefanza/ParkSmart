-- ===============================================================
-- Database Course Project: ParkSmart Relational Database Schema
-- Standard Oracle Database (PL/SQL & SQL Developer Compliant)
-- Encoding: UTF-8
-- File: parksmart_oracle_full.sql
-- ===============================================================

-- ---------------------------------------------------------------
-- 0. ลบตารางเดิมถ้ามีอยู่ (Drop Tables with CASCADE CONSTRAINTS)
-- ---------------------------------------------------------------
BEGIN
  FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
    'COMPLAINT', 'PAYMENT', 'USAGELOG', 'RESERVATION_DETAIL', 
    'RESERVATION', 'FAVORITELOT', 'PARKINGSLOT', 'PARKINGLOT', 
    'ADMINISTRATOR', 'PARKING_OWNER', 'CUSTOMER'
  )) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
  END LOOP;
END;
/

-- ---------------------------------------------------------------
-- 1. ตาราง Customer (ข้อมูลผู้ใช้งาน / ลูกค้า)
-- ---------------------------------------------------------------
CREATE TABLE Customer (
  Customer_ID    VARCHAR2(10) PRIMARY KEY,
  Username       VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash  VARCHAR2(255) NOT NULL,
  FName          VARCHAR2(100) NOT NULL,
  LName          VARCHAR2(100) NOT NULL,
  Phone_Number   VARCHAR2(15) UNIQUE NOT NULL,
  Email          VARCHAR2(100) UNIQUE NOT NULL,
  Account_Status VARCHAR2(20) DEFAULT 'Active',
  Created_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By     VARCHAR2(10),
  Updated_At     TIMESTAMP,
  Updated_By     VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 2. ตาราง Parking_Owner (เจ้าของลานจอดรถ)
-- ---------------------------------------------------------------
CREATE TABLE Parking_Owner (
  ParkingOwner_ID VARCHAR2(10) PRIMARY KEY,
  Username        VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash   VARCHAR2(255) NOT NULL,
  FName           VARCHAR2(100) NOT NULL,
  LName           VARCHAR2(100) NOT NULL,
  Phone_Number    VARCHAR2(15) UNIQUE NOT NULL,
  Email           VARCHAR2(100) UNIQUE NOT NULL,
  Bank_Account    VARCHAR2(50) NOT NULL,
  Created_At      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By      VARCHAR2(10),
  Updated_At      TIMESTAMP,
  Updated_By      VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 3. ตาราง Administrator (ผู้ดูแลระบบ)
-- ---------------------------------------------------------------
CREATE TABLE Administrator (
  Admin_ID      VARCHAR2(10) PRIMARY KEY,
  Username      VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName         VARCHAR2(100) NOT NULL,
  LName         VARCHAR2(100) NOT NULL,
  Email         VARCHAR2(100) UNIQUE NOT NULL,
  Phone_Number  VARCHAR2(15) NOT NULL,
  Created_At    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By    VARCHAR2(10),
  Updated_At    TIMESTAMP,
  Updated_By    VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 4. ตาราง ParkingLot (ลานจอดรถ)
-- ---------------------------------------------------------------
CREATE TABLE ParkingLot (
  Lot_ID            VARCHAR2(10) PRIMARY KEY,
  ParkingOwner_ID   VARCHAR2(10) NOT NULL,
  LotName           VARCHAR2(100) NOT NULL,
  Location          VARCHAR2(255) NOT NULL,
  OpenTime          TIMESTAMP NOT NULL,
  CloseTime         TIMESTAMP NOT NULL,
  FeeRate           NUMBER(10,2) NOT NULL,
  ParkingLot_Status VARCHAR2(20) DEFAULT 'Active',
  Created_At        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By        VARCHAR2(10),
  Updated_At        TIMESTAMP,
  Updated_By        VARCHAR2(10),
  CONSTRAINT UQ_Lot_Location UNIQUE (LotName, Location)
);

-- ---------------------------------------------------------------
-- 5. ตาราง ParkingSlot (ช่องจอดรถ)
-- ---------------------------------------------------------------
CREATE TABLE ParkingSlot (
  Slot_ID            VARCHAR2(10) PRIMARY KEY,
  Lot_ID             VARCHAR2(10) NOT NULL,
  SpaceCode          VARCHAR2(20) NOT NULL,
  Floor              VARCHAR2(10),
  Zone               VARCHAR2(10),
  ParkingSlot_Status VARCHAR2(20) DEFAULT 'Available',
  Created_At         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By         VARCHAR2(10),
  Updated_At         TIMESTAMP,
  Updated_By         VARCHAR2(10),
  CONSTRAINT UQ_Lot_SpaceCode UNIQUE (Lot_ID, SpaceCode)
);

-- ---------------------------------------------------------------
-- 6. ตาราง FavoriteLot (ลานจอดที่บันทึกไว้ - Composite PK)
-- ---------------------------------------------------------------
CREATE TABLE FavoriteLot (
  Customer_ID VARCHAR2(10),
  Lot_ID      VARCHAR2(10),
  Saved_Date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_FavoriteLot PRIMARY KEY (Customer_ID, Lot_ID)
);

-- ---------------------------------------------------------------
-- 7. ตาราง Reservation (ธุรกรรมการจอง)
-- ---------------------------------------------------------------
CREATE TABLE Reservation (
  Booking_ID  VARCHAR2(10) PRIMARY KEY,
  Customer_ID VARCHAR2(10) NOT NULL,
  ReserveDate TIMESTAMP NOT NULL,
  Created_At  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By  VARCHAR2(10),
  Updated_At  TIMESTAMP,
  Updated_By  VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 8. ตาราง Reservation_Detail (รายละเอียดการจอง - Composite PK)
-- ---------------------------------------------------------------
CREATE TABLE Reservation_Detail (
  Booking_ID         VARCHAR2(10),
  Slot_ID            VARCHAR2(10),
  LicensePlate       VARCHAR2(20) NOT NULL,
  StartTime          TIMESTAMP NOT NULL,
  EndTime            TIMESTAMP NOT NULL,
  Totalfee           NUMBER(10,2) NOT NULL,
  Reservation_Status VARCHAR2(20) NOT NULL,
  QRToken            VARCHAR2(255) UNIQUE NOT NULL,
  Created_At         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By         VARCHAR2(10),
  Updated_At         TIMESTAMP,
  Updated_By         VARCHAR2(10),
  CONSTRAINT PK_Reservation_Detail PRIMARY KEY (Booking_ID, Slot_ID)
);

-- ---------------------------------------------------------------
-- 9. ตาราง UsageLog (ประวัติการเข้า-ออกจริง)
-- ---------------------------------------------------------------
CREATE TABLE UsageLog (
  Log_ID           VARCHAR2(10) PRIMARY KEY,
  Booking_ID       VARCHAR2(10) NOT NULL,
  Slot_ID          VARCHAR2(10) NOT NULL,
  Actual_Check_In  TIMESTAMP,
  Actual_Check_Out TIMESTAMP,
  Created_At       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By       VARCHAR2(10),
  Updated_At       TIMESTAMP,
  Updated_By       VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 10. ตาราง Payment (ธุรกรรมการชำระเงิน)
-- ---------------------------------------------------------------
CREATE TABLE Payment (
  Payment_ID     VARCHAR2(10) PRIMARY KEY,
  Booking_ID     VARCHAR2(10) NOT NULL,
  Amount         NUMBER(10,2) NOT NULL,
  Payment_Type   VARCHAR2(20) NOT NULL,
  Payment_Method VARCHAR2(50) NOT NULL,
  Payment_Status VARCHAR2(20) NOT NULL,
  Payment_Date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_At     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By     VARCHAR2(10),
  Updated_At     TIMESTAMP,
  Updated_By     VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- 11. ตาราง Complaint (ข้อร้องเรียน)
-- ---------------------------------------------------------------
CREATE TABLE Complaint (
  Complaint_ID     VARCHAR2(10) PRIMARY KEY,
  Booking_ID       VARCHAR2(10) NOT NULL,
  Customer_ID      VARCHAR2(10) NOT NULL,
  Admin_ID         VARCHAR2(10),
  Title            VARCHAR2(255) NOT NULL,
  Description      CLOB NOT NULL,
  Complaint_Status VARCHAR2(20) DEFAULT 'Pending',
  Complaint_Date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_At       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By       VARCHAR2(10),
  Updated_At       TIMESTAMP,
  Updated_By       VARCHAR2(10)
);

-- ---------------------------------------------------------------
-- กำหนด Foreign Keys (ความสัมพันธ์ระหว่างตารางตาม Relational Diagram)
-- ---------------------------------------------------------------
ALTER TABLE ParkingLot ADD CONSTRAINT FK_Lot_Owner FOREIGN KEY (ParkingOwner_ID)
  REFERENCES Parking_Owner(ParkingOwner_ID);

ALTER TABLE ParkingSlot ADD CONSTRAINT FK_Slot_Lot FOREIGN KEY (Lot_ID) 
  REFERENCES ParkingLot(Lot_ID) ON DELETE CASCADE;

ALTER TABLE FavoriteLot ADD CONSTRAINT FK_Favorite_Customer FOREIGN KEY (Customer_ID) 
  REFERENCES Customer(Customer_ID) ON DELETE CASCADE;

ALTER TABLE FavoriteLot ADD CONSTRAINT FK_Favorite_Lot FOREIGN KEY (Lot_ID) 
  REFERENCES ParkingLot(Lot_ID) ON DELETE CASCADE;

ALTER TABLE Reservation ADD CONSTRAINT FK_Reservation_Customer FOREIGN KEY (Customer_ID) 
  REFERENCES Customer(Customer_ID);

ALTER TABLE Reservation_Detail ADD CONSTRAINT FK_Detail_Reservation FOREIGN KEY (Booking_ID) 
  REFERENCES Reservation(Booking_ID) ON DELETE CASCADE;

ALTER TABLE Reservation_Detail ADD CONSTRAINT FK_Detail_Slot FOREIGN KEY (Slot_ID) 
  REFERENCES ParkingSlot(Slot_ID);

ALTER TABLE UsageLog ADD CONSTRAINT FK_Usage_Reservation_Detail FOREIGN KEY (Booking_ID, Slot_ID) 
  REFERENCES Reservation_Detail(Booking_ID, Slot_ID);

ALTER TABLE Payment ADD CONSTRAINT FK_Payment_Reservation FOREIGN KEY (Booking_ID) 
  REFERENCES Reservation(Booking_ID);

ALTER TABLE Complaint ADD CONSTRAINT FK_Complaint_Reservation FOREIGN KEY (Booking_ID) 
  REFERENCES Reservation(Booking_ID);

ALTER TABLE Complaint ADD CONSTRAINT FK_Complaint_Customer FOREIGN KEY (Customer_ID) 
  REFERENCES Customer(Customer_ID);

ALTER TABLE Complaint ADD CONSTRAINT FK_Complaint_Admin FOREIGN KEY (Admin_ID) 
  REFERENCES Administrator(Admin_ID);

-- ---------------------------------------------------------------
-- ข้อมูลตัวอย่างเริ่มต้น (Sample Seed Data)
-- ---------------------------------------------------------------
INSERT INTO Administrator (Admin_ID, Username, Password_Hash, FName, LName, Email, Phone_Number, Created_By, Updated_By)
VALUES ('ADM001', 'admin', '$2a$10$e8w.p4uFzLSmG.sCgS4k7.m0gqF1Q7RkJW.O76s0Y0/7L8AkmM5ea', 'สมศักดิ์', 'แอดมินใจดี', 'admin@parksmart.local', '089-999-0001', 'SYSTEM', 'SYSTEM');

INSERT INTO Parking_Owner (ParkingOwner_ID, Username, Password_Hash, FName, LName, Phone_Number, Email, Bank_Account, Created_By, Updated_By)
VALUES ('OWN001', 'owner1', '$2a$10$e8w.p4uFzLSmG.sCgS4k7.m0gqF1Q7RkJW.O76s0Y0/7L8AkmM5ea', 'วิชัย', 'ขอนแก่นพาร์คมาสเตอร์', '081-111-2222', 'owner@parksmart.local', 'กสิกรไทย 123-4-56789-0', 'SYSTEM', 'SYSTEM');

INSERT INTO Customer (Customer_ID, Username, Password_Hash, FName, LName, Phone_Number, Email, Account_Status, Created_By, Updated_By)
VALUES ('CUST001', 'customer1', '$2a$10$e8w.p4uFzLSmG.sCgS4k7.m0gqF1Q7RkJW.O76s0Y0/7L8AkmM5ea', 'กานต์', 'คนเดินทาง', '086-555-6666', 'customer1@parksmart.local', 'Active', 'SYSTEM', 'SYSTEM');

INSERT INTO ParkingLot (Lot_ID, ParkingOwner_ID, LotName, Location, OpenTime, CloseTime, FeeRate, ParkingLot_Status, Created_By, Updated_By)
VALUES ('LOT001', 'OWN001', 'Central Khonkaen (เซ็นทรัล ขอนแก่น)', '99, 99/1 ถ.ศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น', TIMESTAMP '2026-01-01 10:00:00', TIMESTAMP '2026-01-01 22:00:00', 20.00, 'Active', 'SYSTEM', 'SYSTEM');

INSERT INTO ParkingLot (Lot_ID, ParkingOwner_ID, LotName, Location, OpenTime, CloseTime, FeeRate, ParkingLot_Status, Created_By, Updated_By)
VALUES ('LOT002', 'OWN001', 'Central Khonkaen Campus', 'ย่านกังสดาล ใกล้มหาวิทยาลัยขอนแก่น ต.ในเมือง อ.เมืองขอนแก่น', TIMESTAMP '2026-01-01 10:00:00', TIMESTAMP '2026-01-01 22:00:00', 20.00, 'Active', 'SYSTEM', 'SYSTEM');

INSERT INTO ParkingSlot (Slot_ID, Lot_ID, SpaceCode, Floor, Zone, ParkingSlot_Status, Created_By, Updated_By)
VALUES ('SLOT001', 'LOT001', '1-A01', 'Floor 1', 'Zone A', 'Available', 'SYSTEM', 'SYSTEM');

INSERT INTO ParkingSlot (Slot_ID, Lot_ID, SpaceCode, Floor, Zone, ParkingSlot_Status, Created_By, Updated_By)
VALUES ('SLOT002', 'LOT001', '1-A02', 'Floor 1', 'Zone A', 'Available', 'SYSTEM', 'SYSTEM');

INSERT INTO Reservation (Booking_ID, Customer_ID, ReserveDate, Created_By, Updated_By)
VALUES ('BK001', 'CUST001', TIMESTAMP '2026-10-12 10:00:00', 'CUST001', 'CUST001');

INSERT INTO Reservation_Detail (Booking_ID, Slot_ID, LicensePlate, StartTime, EndTime, Totalfee, Reservation_Status, QRToken, Created_By, Updated_By)
VALUES ('BK001', 'SLOT001', 'กข 9999 ขอนแก่น', TIMESTAMP '2026-10-12 10:00:00', TIMESTAMP '2026-10-12 12:00:00', 40.00, 'Confirmed', 'PS-DEMO-TOKEN-001', 'CUST001', 'CUST001');

INSERT INTO Payment (Payment_ID, Booking_ID, Amount, Payment_Type, Payment_Method, Payment_Status, Payment_Date, Created_By, Updated_By)
VALUES ('PAY001', 'BK001', 40.00, 'Prepaid_Parking_Fee', 'PromptPay', 'Completed', TIMESTAMP '2026-10-12 10:05:00', 'CUST001', 'CUST001');

COMMIT;
