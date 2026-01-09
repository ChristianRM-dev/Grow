// src/modules/shared/pdf/laurelesPdfHeader.ts
import type { SalesNotePdfHeaderConfig } from "@/modules/sales-notes/pdf/components/SalesNotePdfHeader";

export const LAURELES_PDF_HEADER: SalesNotePdfHeaderConfig = {
  logoPublicPath: "/brand/laureles-logo.jpeg",
  nurseryName: "VIVERO LOS LAURELES",
  rfc: "R.F.C. VLA170116GW9",
  addressLines: [
    "Km. 3.5 carretera Coquimatlán - Pueblo Juarez S/N",
    "Col. La esperanza, Coquimatlán, Colima, C.p. 28400",
  ],
  phone: "Tel: 3·312 163 3433",
  email: "e-mail: viveroadmon@gmail.com",
  issuedPlaceLine1: "EXPEDIDO EN",
  issuedPlaceLine2: "COQUIMATLÁN, COL.",
};
