# TabMan 📑

> **AI-Powered, Context-Aware Browser Tab Cleaner powered by TypeSafe AI's Jev System One model.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-yellowgreen.svg)](#chrome-extension-setup)
[![AI Engine](https://img.shields.io/badge/AI_Engine-TypeSafe_Jev-purple.svg)](https://docs.typesafe.ai)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel_Ready-black.svg)](#cloud-deployment-vercel)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

---

## 💡 Overview

Tab overload disrupts developer focus. **TabMan** solves tab sprawl with semantic intelligence: simply describe what you are actively working on in plain English (e.g., *"Debugging Stripe webhook payment verification on staging"*), and TabMan analyzes all open tabs in your active window to separate task-relevant tabs from distractions—allowing you to close all unrelated tabs in a single click.

Unlike traditional tab managers that rely on rigid URL regexes or keyword rules, TabMan uses **TypeSafe AI's Jev System One model** to perform parallel, calibrated probabilistic judgments across tab metadata.

---

## ✨ Key Features

- 🧠 **Context-Aware Semantic Triage**: Compares active tab metadata against your current task using TypeSafe's calibrated `noul` probabilistic primitive.
- ⚡ **Ultra-Fast Parallel Evaluation**: Uses System One's parallel evaluation to judge up to 60 tabs in a single round-trip without noticeable latency.
- 🛡️ **Privacy-First Design**: Evaluates **only** tab titles and URLs. It never inspects DOM content, cookies, storage, or form inputs.
- 🎯 **Deterministic Code Policy**: AI provides calibrated probability scores (0.0 to 1.0); deterministic code enforces decision thresholds, ensuring predictability and safety.
- 🖱️ **Single-Click Cleanup**: Displays a clear breakdown of **"Keeping"** vs **"To Close"** tabs with an instant batch-close action.
- ☁️ **Dual Deployment**: Runs locally (`http://localhost:3000`) or deployed globally as a serverless backend on **Vercel** with a built-in web test dashboard.
- 🧩 **Manifest V3 Compliant**: Built for modern Chromium browsers (Google Chrome, Brave, Arc, Microsoft Edge).

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Browser ["Chrome / Chromium Browser"]
        Ext["TabMan Extension (MV3)"]
        Tabs[("Open Tabs\n(Title + URL)")]
        Tabs -.->|chrome.tabs.query| Ext
    end

    subgraph Backend ["Backend Service (Local / Vercel)"]
        API["Express Server\n(/api/tabs-relevance)"]
        Policy["Deterministic Policy Engine\n(Threshold >= 0.5)"]
    end

    subgraph AI ["TypeSafe AI Cloud"]
        Jev["Jev System One Model\n(Parallel Noul Judgments)"]
    end

    Ext -->|POST tabs + task| API
    API -->|Evaluate state + questions| Jev
    Jev -->|Calibrated Probabilities (0.0 - 1.0)| Policy
    Policy -->|Keep / Close decisions| API
    API -->|JSON Response| Ext
    Ext -->|chrome.tabs.remove(ids)| Tabs
```

---

## 🔬 How Jev Decides Relevance

TabMan leverages the **TypeSafe AI System One SDK** (`@typesafe-ai/sdk`).

1. **State**: The backend constructs a structured state containing the user's task and the list of tabs:
   ```json
   {
     "task": "Debugging Stripe webhook payment verification",
     "tabs": [
       { "title": "Stripe Docs - Webhook Verification", "url": "https://stripe.com/docs/webhooks" },
       { "title": "YouTube - Lo-Fi Beats to Relax/Study", "url": "https://youtube.com/watch?v=..." }
     ]
   }
   ```

2. **Parallel Judgment**: For each tab, a typed `noul` (yes/no probability) question is asked in parallel:
   ```javascript
   questions[`t${i}`] = noul(
     `Is the browser tab described by \`tabs[${i}].title\` and \`tabs[${i}].url\` ` +
     `relevant to, useful for, or actively part of the user's current task, ` +
     `given in \`task\`? Relevant includes reference material, docs, tickets, ` +
     `communication, or tools directly tied to the task — not just loosely similar topics.`
   );
   ```

3. **Policy Boundary**: The model supplies calibrated probability ($0.0$ to $1.0$), while code enforces the decision boundary:
   - $\ge 50\%$ relevance $\rightarrow$ **Keep**
   - $< 50\%$ relevance $\rightarrow$ **To Close**

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18 or higher
- A **TypeSafe AI API Key** (get one at [typesafe.ai](https://typesafe.ai))

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Purushotham-Prajapati-24/tabMan.git
cd tabMan
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
TYPESAFE_API_KEY=your_typesafe_api_key_here
PORT=3000
```

### 4. Run the Backend
Start the Express server locally:
```bash
npm start
```
The server will start at `http://localhost:3000` with a live web test dashboard.

---

## 🧩 Chrome Extension Setup

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension` folder inside this repository:
   ```text
   tabMan/extension
   ```
5. Pin **Jev Tab Cleaner** to your browser toolbar.
6. Open the extension popup:
   - If running locally, ensure **Server URL** is set to `http://localhost:3000`.
   - If using cloud deployment, set **Server URL** to your Vercel URL (e.g., `https://your-app.vercel.app`).
7. Enter your current task and click **Find related tabs**!

---

## ☁️ Cloud Deployment (Vercel)

This project is pre-configured for **zero-config serverless deployment** on Vercel:

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure Project Settings:
   - **Framework Preset**: `Express` (or `Other`)
   - **Build Command**: *Disabled / Default* (no build step required)
   - **Output Directory**: *Disabled / Default* (`N/A`)
3. Under **Environment Variables**, add:
   - `TYPESAFE_API_KEY`: `your_typesafe_api_key`
4. Click **Deploy**.
5. Copy your live Vercel URL and paste it into the **Server URL** field of your Chrome extension popup.

---

## 📡 API Reference

### `POST /api/tabs-relevance`
Evaluates the relevance of an array of browser tabs against a task description.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "task": "Fixing database connection leak in Go service",
  "tabs": [
    {
      "id": 101,
      "title": "Go sql package - connection pooling guide",
      "url": "https://pkg.go.dev/database/sql"
    },
    {
      "id": 102,
      "title": "Amazon - Ergonomic Mouse",
      "url": "https://amazon.com/dp/..."
    }
  ]
}
```

#### Response (`200 OK`)
```json
{
  "results": [
    {
      "id": 101,
      "title": "Go sql package - connection pooling guide",
      "url": "https://pkg.go.dev/database/sql",
      "relevant": 0.96,
      "keep": true
    },
    {
      "id": 102,
      "title": "Amazon - Ergonomic Mouse",
      "url": "https://amazon.com/dp/...",
      "relevant": 0.04,
      "keep": false
    }
  ],
  "usage": {
    "input_tokens": 184,
    "output_tokens": 28
  },
  "skipped": 0
}
```

---

### `GET /api/health`
Health check endpoint for uptime monitors.

#### Response (`200 OK`)
```json
{
  "status": "ok"
}
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Extension Frontend** | HTML5, CSS3, Vanilla JS | Lightweight, zero-dependency Manifest V3 popup |
| **Backend Server** | Node.js, Express 5 | REST API with static file hosting & CORS support |
| **AI Evaluation Engine** | `@typesafe-ai/sdk` (Jev System One) | Parallel, calibrated natural language judgments |
| **Deployment Runtime** | Vercel Serverless Functions | Global edge routing, automatic SSL, zero-maintenance |
| **Browser API** | `chrome.tabs` (MV3) | Tab discovery, querying, and lifecycle management |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
