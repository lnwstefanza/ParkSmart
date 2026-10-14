-- ===============================================================
-- Database Course Project: ParkSmart Relational Database Schema
-- Standard Oracle SQL DDL / Relational Diagram Compliant
-- File: parksmart_schema.sql
-- ===============================================================

-- 1. Customer (ข้อมูลผู้ใช้งาน)
CREATE TABLE Customer (
  Customer_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Phone_Number VARCHAR2(15) UNIQUE NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Account_Status VARCHAR2(20) DEFAULT 'Active',
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 2. Parking_Owner (เจ้าของลานจอดรถ)
CREATE TABLE Parking_Owner (
  ParkingOwner_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Phone_Number VARCHAR2(15) UNIQUE NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Bank_Account VARCHAR2(50) NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 3. Administrator (ผู้ดูแลระบบ)
CREATE TABLE Administrator (
  Admin_ID VARCHAR2(10) PRIMARY KEY,
  Username VARCHAR2(50) UNIQUE NOT NULL,
  Password_Hash VARCHAR2(255) NOT NULL,
  FName VARCHAR2(100) NOT NULL,
  LName VARCHAR2(100) NOT NULL,
  Email VARCHAR2(100) UNIQUE NOT NULL,
  Phone_Number VARCHAR2(15) NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 4. ParkingLot (ลานจอดรถ)
CREATE TABLE ParkingLot (
  Lot_ID VARCHAR2(10) PRIMARY KEY,
  ParkingOwner_ID VARCHAR2(10) NOT NULL,
  LotName VARCHAR2(100) NOT NULL,
  Location VARCHAR2(255) NOT NULL,
  OpenTime TIMESTAMP NOT NULL,
  CloseTime TIMESTAMP NOT NULL,
  FeeRate NUMBER(10,2) NOT NULL,
  ParkingLot_Status VARCHAR2(20) DEFAULT 'Active',
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10),
  CONSTRAINT UQ_Lot_Location UNIQUE (LotName, Location)
);

-- 5. ParkingSlot (ช่องจอดรถ)
CREATE TABLE ParkingSlot (
  Slot_ID VARCHAR2(10) PRIMARY KEY,
  Lot_ID VARCHAR2(10) NOT NULL,
  SpaceCode VARCHAR2(20) NOT NULL,
  Floor VARCHAR2(10),
  Zone VARCHAR2(10),
  ParkingSlot_Status VARCHAR2(20) DEFAULT 'Available',
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10),
  CONSTRAINT UQ_Lot_SpaceCode UNIQUE (Lot_ID, SpaceCode)
);

-- 6. FavoriteLot (ลานจอดที่บันทึกไว้ - Composite PK)
CREATE TABLE FavoriteLot (
  Customer_ID VARCHAR2(10),
  Lot_ID VARCHAR2(10),
  Saved_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_FavoriteLot PRIMARY KEY (Customer_ID, Lot_ID)
);

-- 7. Reservation (ธุรกรรมการจอง)
CREATE TABLE Reservation (
  Booking_ID VARCHAR2(10) PRIMARY KEY,
  Customer_ID VARCHAR2(10) NOT NULL,
  ReserveDate TIMESTAMP NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 8. Reservation_Detail (รายละเอียดการจอง - Composite PK)
CREATE TABLE Reservation_Detail (
  Booking_ID VARCHAR2(10),
  Slot_ID VARCHAR2(10),
  LicensePlate VARCHAR2(20) NOT NULL,
  StartTime TIMESTAMP NOT NULL,
  EndTime TIMESTAMP NOT NULL,
  Totalfee NUMBER(10,2) NOT NULL,
  Reservation_Status VARCHAR2(20) NOT NULL,
  QRToken VARCHAR2(255) UNIQUE NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10),
  CONSTRAINT PK_Reservation_Detail PRIMARY KEY (Booking_ID, Slot_ID)
);

-- 9. UsageLog (ประวัติการเข้า-ออกจริง)
CREATE TABLE UsageLog (
  Log_ID VARCHAR2(10) PRIMARY KEY,
  Booking_ID VARCHAR2(10) NOT NULL,
  Slot_ID VARCHAR2(10) NOT NULL,
  Actual_Check_In TIMESTAMP,
  Actual_Check_Out TIMESTAMP,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 10. Payment (ธุรกรรมการเงิน)
CREATE TABLE Payment (
  Payment_ID VARCHAR2(10) PRIMARY KEY,
  Booking_ID VARCHAR2(10) NOT NULL,
  Amount NUMBER(10,2) NOT NULL,
  Payment_Type VARCHAR2(20) NOT NULL,
  Payment_Method VARCHAR2(50) NOT NULL,
  Payment_Status VARCHAR2(20) NOT NULL,
  Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- 11. Complaint (ข้อร้องเรียน)
CREATE TABLE Complaint (
  Complaint_ID VARCHAR2(10) PRIMARY KEY,
  Booking_ID VARCHAR2(10) NOT NULL,
  Customer_ID VARCHAR2(10) NOT NULL,
  Admin_ID VARCHAR2(10),
  Title VARCHAR2(255) NOT NULL,
  Description CLOB NOT NULL,
  Complaint_Status VARCHAR2(20) DEFAULT 'Pending',
  Complaint_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Created_By VARCHAR2(10),
  Updated_At TIMESTAMP,
  Updated_By VARCHAR2(10)
);

-- ===============================================================
-- กำหนด Foreign Keys (ความสัมพันธ์ระหว่างตารางตาม Relational Diagram)
-- ===============================================================
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
