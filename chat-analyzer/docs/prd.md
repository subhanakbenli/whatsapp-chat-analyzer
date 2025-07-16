# whatsapp-chat-analyzer - Product Requirements Document (MVP)

* **Version:** 2.0
* **Date:** July 16, 2025
* **Status:** Defined

This document outlines the Minimum Viable Product (MVP) for a web application designed to analyze WhatsApp chat exports, featuring "smart chunking" logic for improved accuracy.

---

### **1. Technology & Infrastructure**

* **Framework:** Next.js
* **Hosting Platform:** Vercel
* **Visualization Library:** Chart.js (using the `react-chartjs-2` wrapper)
* **Report Generation:** jsPDF & html2canvas
* **AI Engine:** Google Gemini API

### **2. Data Storage**

**No Database Required:** All data is processed in memory and analysis results are returned directly to the client. No persistent storage is used, making the application completely stateless and privacy-focused.

### **3. User Flow**

1.  **Landing Page (`/`)**: A clean UI welcomes the user and features a prominent file upload area.
2.  **File Upload**: The user uploads their `.txt` chat export.
3.  **Analysis in Progress**: The UI enters a waiting state with a loading indicator while the backend processes the file.
4.  **Results Screen (Dashboard)**: The UI dynamically renders the analysis data into a dashboard of charts and stats.
5.  **Download Report**: The user can download the report as a PDF or HTML file.

### **4. Backend Architecture: Smart Chunking Logic**

The core logic resides in the `app/api/analyze/route.js` serverless function.

**Algorithm:**

1.  Receive the `.txt` file via a `POST` request.
2.  Create a parser function using Regex to extract `timestamp` and `line` from each line of the chat file.
3.  Implement a "Smart Chunking" algorithm:
    * Iterate through the file line by line, building a `currentChunk`.
    * If `currentChunk` size exceeds a target (e.g., 3MB), look for a "conversation break" (a gap of 4+ hours between messages).
    * When a break is found, finalize the current chunk and start a new one.
4.  Send each chunk to the Gemini API using the predefined JSON prompt.
5.  Aggregate the JSON responses from all chunks into a single, final JSON object.
6.  Return the final JSON directly to the frontend for immediate display.

### **5. Key Features**

* AI-Powered Analysis via Gemini.
* Interactive Dashboard with charts and stats.
* Smart Chunking for high accuracy.
* Privacy-focused data handling (no persistent storage).
* Downloadable PDF/HTML reports.