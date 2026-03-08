ArthroMeasure - Knee

High-fidelity preoperative TKA planning and alignment analysis suite.

ArthroMeasure - Knee is a high-precision clinical drafting tool designed for orthopaedic surgeons and researchers. It enables detailed analysis of long-axis lower limb radiographs, providing comprehensive alignment phenotyping using the MacDessi CPAK framework while bypassing common hospital IT infrastructure restrictions.
🖥️ Workspace Operations (The Study Window)

The main viewer is designed for high-magnification precision and flexibility within locked-down clinical environments.
📥 Loading a Case

To bypass hospital firewalls that block standard file uploads, ArthroMeasure supports three import methods:

*   LOAD STUDY: Click the central dash-box to select a file from your local drive.

*   CAPTURE WINDOW: Click this button to select your PACS or imaging software window. The app will capture a high-resolution snapshot directly from your screen.

*   PASTE (CTRL + V): Use any screen-snip tool (e.g., Win + Shift + S) to copy an image from your PACS, then simply press Ctrl + V anywhere on the app to load it instantly.

🕹️ Navigation & Interaction HUD

Once a study is loaded, use these commands to navigate:

*   SCROLL: Zoom in/out. Landmark markers are anatomically anchored; they scale 1:1 with the image to maintain accuracy at any magnification.

*   RIGHT-CLICK + DRAG: Pan across the long-axis image.

*   360° RADIAL HANDLE: Hover over any landmark to see the white resize handle. Drag this handle from any angle to scale the marker. The handle becomes a "Ghost Handle" (40% translucent) when clicked to ensure cortical edges remain visible.

🔘 Functional Buttons

*   TOP RIGHT (Reset icon): Completely clears the current study and resets all landmark data, returning the app to the initial load screen.

*   BOTTOM RIGHT (Maximize icon): Instantly resets the zoom and pan to fit the entire radiograph within the viewing window.

📋 Clinical Workflow

*   Limb Lateralization: Select Left or Right in the sidebar. This calibrates the aHKA mathematical logic to ensure Varus/Valgus values are correctly signed.

*   Acquisition: Follow the prompted 10-point sequence:

    *   P1: Center of Femoral Head (best-fit circle).

    *   P2 & P3: Proximal & Distal Femoral Shaft (medullary centers).

    *   P4: Femoral Knee Center (apex of intercondylar notch).

    *   MFC & LFC: Medial & Lateral Femoral Condyles (most distal points).

    *   P5: Tibial Knee Center (midpoint of tibial spines).

    *   MTP & LTP: Medial & Lateral Tibial Plateaus (articular centers).

    *   P6: Ankle Center (talar dome midpoint).

*   Refinement: Hover over sidebar landmarks to highlight bone points; use radial handles to fit markers to anatomy.

*   Diagnostic Analysis: Review the unified 7-row clinical table and the automated MacDessi CPAK classification (Type I - IX).

*   Data Export: Click "Export Study" to copy the full clinical report to the clipboard.

📐 Clinical Metrics Output

*   HKA: Hip-Knee-Ankle Angle (Mechanical Alignment)

*   AMA: Anatomic-Mechanical Angle (VCA/Jig Planning)

*   mLDFA: Mechanical Lateral Distal Femoral Angle

*   mMPTA: Mechanical Medial Proximal Tibial Angle

*   JLCA: Joint Line Congruency Angle

*   aHKA: Arithmetic HKA (Constitutional Bony Alignment)

*   JLO: Joint Line Obliquity (Global Joint Tilt)

*   CPAK: MacDessi Phenotype Classification (Type and Clinical Description)

🛠️ Technical Stack

*   Framework: React 19

*   Styling: Tailwind CSS 4

*   Icons: Lucide-React

*   Build Tool: Vite

**Disclaimer:** *ArthroMeasure - Knee is intended for research and educational purposes only. All clinical decisions must be made based on comprehensive professional evaluation by a qualified medical professional.*
