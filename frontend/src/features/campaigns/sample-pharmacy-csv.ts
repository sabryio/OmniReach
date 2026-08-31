/**
 * Sample pharmacy CSV data for testing CSV importer
 *
 * Features:
 * - Mixed phone formats (international, local, with/without formatting)
 * - Arabic names for i18n testing
 * - Custom fields (prescription, doctor, expiry)
 * - Invalid rows (empty phone, malformed numbers) for validation testing
 */

export const SAMPLE_PHARMACY_CSV = `Name,Phone,Prescription,Doctor,Expiry
أحمد محمد,+20 101 234 5678,Amoxicillin 500mg,Dr. Ahmed Hassan,2026-12-31
فاطمة علي,01012345679,Paracetamol 500mg,Dr. Fatima Mohamed,2026-11-30
Mohamed Khaled,201012345680,Ibuprofen 400mg,Dr. Khaled Ibrahim,2026-10-15
Sarah Ahmed,+201012345681,Vitamin D3 1000IU,Dr. Sarah Ali,2027-01-20
علي حسن,0101234568,Metformin 850mg,Dr. Ali Hassan,2026-09-10
Layla Mohamed,20101234568,Omeprazole 20mg,Dr. Layla Ahmed,2026-08-05
مصطفى عبدالله,+20 101 234 5684,Aspirin 100mg,Dr. Mustafa Abdallah,2027-02-14
Nour Elsayed,,Atorvastatin 10mg,Dr. Nour Mohamed,2026-12-01
Hassan Mahmoud,invalid-phone,Losartan 50mg,Dr. Hassan Ali,2026-07-22
زينب أحمد,+20 101 234 5687,Levothyroxine 50mcg,Dr. Zeinab Ibrahim,2027-03-10`;

/**
 * Convert sample CSV string to File object for programmatic import
 */
export function sampleCsvToFile(): File {
  const blob = new Blob([SAMPLE_PHARMACY_CSV], { type: "text/csv" });
  return new File([blob], "sample-pharmacy-patients.csv", {
    type: "text/csv",
  });
}
