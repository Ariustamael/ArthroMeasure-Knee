# ArthroMeasure - Knee
**High-fidelity TKA preoperative alignment analysis.**

ArthroMeasure - Knee is a high-precision clinical drafting tool designed for orthopaedic surgeons and researchers. It enables the detailed analysis of long-axis lower limb radiographs, moving beyond traditional measurements to provide comprehensive alignment phenotyping using the MacDessi CPAK framework.

📥 Loading a Case

There are three ways to import a radiograph into the workspace:

    LOAD STUDY: Click the central dash-box to select a file from your local drive.

    CAPTURE WINDOW: Click this button to select your PACS window. The app will take a high-resolution snapshot directly from your screen.

    PASTE (CTRL + V): Use any screen-snip tool (e.g., Win+Shift+S) to copy an image from your PACS, then simply press Ctrl + V anywhere on the app to load it instantly.

🕹️ Navigation HUD

Once a study is loaded, use these commands to navigate:

    SCROLL: Zoom in/out. Markers scale 1:1 with the image to maintain anatomical accuracy.

    RIGHT-CLICK + DRAG: Pan across the long-axis image.

    360° RADIAL HANDLE: Hover over a marker to see the white resize handle. Drag this handle to fit markers to cortical edges. The handle becomes a "Ghost Handle" (40% translucent) when clicked to ensure the bone remains visible.

🔘 Functional Buttons

    TOP RIGHT (Reset icon): Clears the current study and resets all landmark data, returning you to the load screen for a new case.

    BOTTOM RIGHT (Maximize icon): Instantly resets the zoom and pan to fit the entire radiograph within the viewing window.

📋 Clinical Workflow

    Lateralization: Select Left or Right in the sidebar to calibrate the aHKA mathematical logic.

    Acquisition: Follow the prompted 10-point sequence:

        P1: Center of Femoral Head.

        P2 & P3: Proximal & Distal Femoral Shaft.

        P4: Femoral Knee Center.

        MFC & LFC: Medial & Lateral Femoral Condyles.

        P5: Tibial Knee Center.

        MTP & LTP: Medial & Lateral Tibial Plateaus.

        P6: Ankle Center.

    Analysis: Review the unified 7-row clinical table (HKA, AMA, mLDFA, mMPTA, JLCA, aHKA, JLO).

    Phenotyping: View the automated MacDessi CPAK classification (Type I - IX).

    Export: Click "Export Study" to copy all metrics to the clipboard.

🚀 Technical Innovation

    Anatomical Scaling Engine: Markers stay anchored to the anatomy regardless of zoom level.

    Bidirectional Sync: Hovering over sidebar items highlights bone landmarks for rapid verification.

    Clamped Utility Handles: Resize handles are restricted to a professional 5px-10px range.

🛠️ Technical Stack

    Framework: React 19

    Styling: Tailwind CSS 4

    Icons: Lucide-React

    Build Tool: Vite

Disclaimer: ArthroMeasure - Knee is intended for research and educational purposes only. All clinical decisions must be made based on comprehensive professional evaluation by a qualified medical professional.
