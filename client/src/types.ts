export type Role = 'Customer' | 'Owner' | 'Admin';

export interface User {
  id: number;
  username: string;
  role: Role;
  fname: string;
  lname: string;
  email?: string;
  phone?: string;
}

export interface ParkingLot {
  Lot_ID: number;
  ParkingOwner_ID: number;
  LotName: string;
  Location: string;
  District: string;
  Province: string;
  Latitude?: number;
  Longitude?: number;
  OpenTime: string;
  CloseTime: string;
  FeeRate_Per_Hour: number;
  Free_Minutes: number;
  Billing_Unit_Min: number;
  Daily_Max_Fee: number;
  Deposit_Amount: number;
  Is_Recommended: number;
  Recommended_Order: number;
  ParkingLot_Status: 'Active' | 'Pending' | 'Suspended' | 'Rejected';
  Image_Url: string;
  Description: string;
  OwnerFName?: string;
  OwnerLName?: string;
  OwnerUsername?: string;
  total_slots?: number;
  available_slots?: number;
  occupied_slots?: number;
  reserved_slots?: number;
}

export interface ParkingSlot {
  Slot_ID: number;
  Lot_ID: number;
  SpaceCode: string;
  Floor: string;
  Zone: string;
  ParkingSlot_Status: 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';
}

export interface ReservationItem {
  Booking_ID: number;
  Customer_ID?: number;
  ReserveDate: string;
  Detail_ID: number;
  Slot_ID: number;
  LicensePlate: string;
  Expected_Arrival: string;
  Hold_Until: string;
  Booked_Hours?: number;
  Booked_End?: string;
  Base_Fee?: number;
  Late_Penalty?: number;
  Overtime_Penalty?: number;
  Deposit_Amount: number;
  Parked_Minutes: number;
  Totalfee: number;
  Reservation_Status: 'Pending_Payment' | 'Confirmed' | 'Checked_In' | 'Awaiting_Final_Payment' | 'Completed' | 'Cancelled' | 'Expired';
  QRToken: string;
  SpaceCode: string;
  Floor: string;
  Zone: string;
  Lot_ID: number;
  LotName: string;
  Location: string;
  District?: string;
  FeeRate_Per_Hour: number;
  Free_Minutes: number;
  Daily_Max_Fee: number;
  CloseTime?: string;
  Actual_Check_In?: string;
  Actual_Check_Out?: string;
  qrDataUrl?: string;
  FName?: string;
  LName?: string;
  Phone_Number?: string;
}

export interface ComplaintItem {
  Complaint_ID: number;
  Booking_ID?: number;
  Customer_ID: number;
  Admin_ID?: number;
  Title: string;
  Description: string;
  Complaint_Status: 'Pending' | 'Resolved' | 'Rejected';
  Admin_Response?: string;
  Complaint_Date: string;
  CustomerUsername?: string;
}
