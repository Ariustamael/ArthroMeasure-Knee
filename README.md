# ArthroMeasure - Knee
**High-fidelity preoperative TKA planning and alignment analysis suite.**

ArthroMeasure - Knee is a high-precision clinical drafting tool designed for orthopaedic surgeons and researchers. It enables the detailed analysis of long-axis lower limb radiographs, moving beyond traditional measurements to provide comprehensive alignment phenotyping using the MacDessi CPAK framework.

## 🚀 Key Features
*   **Precision Geometry Engine:** Automatic calculation of MFA, AFA, MTA, and Joint Lines using vector dot-product logic.
*   **MacDessi CPAK Classification:** Real-time assignment of the 9 constitutional phenotypes based on Arithmetic HKA (aHKA) and Joint Line Obliquity (JLO).
*   **Anatomical Scaling:** Landmark markers are anchored to the image coordinate space, maintaining a consistent 1:1 size ratio with the bone during zoom and pan operations.
*   **360° Radial Resizer:** Innovative UI allows for smooth, non-restricted scaling of landmarks from any angle.
*   **Bidirectional Sync:** Hovering over the sidebar landmarks triggers a visual pulse on the corresponding bone point for rapid verification.

## 📋 Clinical Workflow
To ensure maximum geometric accuracy, follow this standardized operational sequence:

1.  **Limb Lateralization:** Select the **Left** or **Right** toggle in the sidebar. This calibrates the mathematical logic for aHKA to ensure Varus/Valgus values are correctly signed.
2.  **Image Import:** Drag and drop a high-resolution long-axis radiograph into the workspace.
3.  **Landmark Acquisition:** Follow the prompted 10-point clinical sequence:
    *   **P1:** Center of Femoral Head (best-fit circle).
    *   **P2 & P3:** Proximal and Distal Femoral Shaft (medullary canal centers).
    *   **P4:** Femoral Knee Center (intercondylar notch apex).
    *   **MFC & LFC:** Medial and Lateral Femoral Condyles (most distal points).
    *   **P5:** Tibial Knee Center (midpoint of tibial spines).
    *   **MTP & LTP:** Medial and Lateral Tibial Plateaus (articular centers).
    *   **P6:** Ankle Center (talar dome midpoint).
4.  **Refinement & Fitting:** 
    *   **Zoom/Pan:** Use the mouse scroll to zoom and Right-Click + Drag to navigate.
    *   **Anatomical Scaling:** Grab the radial handle on the perimeter of any point to scale the target marker to match the patient’s anatomy (e.g., fitting the femoral head).
5.  **Diagnostic Analysis:** Review the automated 7-row clinical table and the dynamic CPAK phenotype classification.
6.  **Data Export:** Click "Export Study" to copy the full measurement report to the clipboard for clinical notes or research spreadsheets.

## 📐 Clinical Metrics Output
*   **HKA:** Hip-Knee-Ankle Angle (Mechanical Alignment)
*   **AMA:** Anatomic-Mechanical Angle (VCA/Jig Planning)
*   **mLDFA:** Mechanical Lateral Distal Femoral Angle
*   **mMPTA:** Mechanical Medial Proximal Tibial Angle
*   **JLCA:** Joint Line Congruency Angle
*   **aHKA:** Arithmetic HKA (Constitutional/Bony Alignment)
*   **JLO:** Joint Line Obliquity (Joint Tilt)

## 🛠️ Technical Stack
*   **Framework:** React 19
*   **Styling:** Tailwind CSS 4
*   **Icons:** Lucide-React
*   **Build Tool:** Vite

---
**Disclaimer:** *ArthroMeasure - Knee is intended for research and educational purposes only. All clinical decisions must be made based on comprehensive professional evaluation by a qualified medical professional.*
