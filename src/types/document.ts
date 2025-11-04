// src/types/document.ts

// กำหนด Type สำหรับข้อมูลผู้รับ
export interface RecipientData {
  recipientTitle: string;
  recipientAddress: string;
  recipientProvince: string;
  recipientPostal: string;
}

// 💡 กำหนด Type สำหรับข้อมูลผู้ส่ง
export interface SenderData {
  documentNumber: string;
  senderOrg: string;
  senderUniversity: string;
  senderAddress1: string;
  senderAddress2: string;
  senderPostal: string;
}
