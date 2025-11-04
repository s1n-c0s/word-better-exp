// src/utils/dataUtils.ts

import { RecipientData, SenderData } from "../types/document";

// สร้าง String ข้อมูลผู้ส่ง (6 บรรทัด)
export const generateSenderString = (data: SenderData): string => {
  return [
    data.documentNumber,
    data.senderOrg,
    data.senderUniversity,
    data.senderAddress1,
    data.senderAddress2,
    data.senderPostal,
  ].join("\n");
};

// สร้าง String ข้อมูลผู้รับ (4 บรรทัดต่อชุด)
export const generateRecipientString = (
  recipients: RecipientData[]
): string => {
  return recipients
    .map((r) =>
      [
        r.recipientTitle,
        r.recipientAddress,
        r.recipientProvince,
        r.recipientPostal,
      ].join("\n")
    )
    .join("\n\n");
};
