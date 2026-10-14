import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBaht(amount: number = 0): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('THB', '฿');
}

export function getGoogleMapsUrl(lotName: string = ''): string {
  const name = lotName.toLowerCase();
  let destination = '';

  if (name.includes('campus')) {
    destination = 'Central Khonkaen Campus';
  } else if (name.includes('central') || name.includes('เซ็นทรัล')) {
    destination = 'Central Khon Kaen';
  } else if (name.includes('fairy') || name.includes('แฟรี่')) {
    destination = 'Fairy Plaza Khonkaen';
  } else if (name.includes('big c') || name.includes('บิ๊กซี')) {
    destination = 'Big C 1 Khon Kaen';
  } else if (name.includes('lotus') || name.includes('โลตัส') || name.includes('โนนม่วง')) {
    destination = 'โลตัส ขอนแก่น 2';
  } else if (name.includes('ต้นตาล') || name.includes('ton tann')) {
    destination = 'ตลาดต้นตาล ขอนแก่น';
  } else if (name.includes('ตึกแก่น') || name.includes('the kaen') || name.includes('kaen tower')) {
    destination = 'ตึกแก่น ขอนแก่น';
  } else {
    destination = `${lotName} ขอนแก่น`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

