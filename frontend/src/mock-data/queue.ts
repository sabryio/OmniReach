/**
 * Mock Queue Data
 * Sample pending messages in dispatch queue
 */
import type { QueueItem } from "@/types";

export const MOCK_QUEUE: QueueItem[] = [
  {
    id: "q001",
    campaignId: "camp-001",
    campaignTitle: "Monthly Prescription Refill Reminder",
    contactId: "c001",
    recipientName: "أحمد محمد",
    phone: "+201012345678",
    renderedText: "السلام عليكم، نذكرك بأن وصفتك الطبية جاهزة",
    status: "pending",
    attempts: 0,
  },
  {
    id: "q002",
    campaignId: "camp-002",
    campaignTitle: "COVID-19 Booster Dose Available",
    contactId: "c006",
    recipientName: "Mohamed Hassan",
    phone: "+201087654321",
    renderedText: "Your COVID-19 booster dose is now available",
    status: "held_rate_limit",
    attempts: 1,
  },
  {
    id: "q003",
    campaignId: "camp-005",
    campaignTitle: "Diabetes Care Program Enrollment",
    contactId: "c011",
    recipientName: "حسن محمود",
    phone: "+201134567890",
    renderedText: "ندعوك للانضمام إلى برنامج رعاية مرضى السكري",
    status: "pending",
    attempts: 0,
  },
  {
    id: "q004",
    campaignId: "camp-001",
    campaignTitle: "Monthly Prescription Refill Reminder",
    contactId: "c002",
    recipientName: "فاطمة علي",
    phone: "+201098765432",
    renderedText: "نذكرك بأن وصفتك الطبية جاهزة لإعادة التعبئة",
    status: "sent",
    attempts: 1,
    sentAt: Date.now() - 60000,
  },
];
