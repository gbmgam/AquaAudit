# AquaAudit — Browser-Based Silent Water Loss Detection

AquaAudit is a responsive, single-page web application designed for hostels, paying guest accommodations (PGs), apartment associations, and residential societies. It detects silent water leaks (such as toilet cistern leaks, overhead tank overflow, and underground pipe seepage) using only two manually logged meter readings per day:
- **11:00 PM **
- **5:00 AM**

All calculations, simulations, leak detection, validations, and robustness tests execute locally inside the browser in plain, deterministic TypeScript. No external APIs, LLMs, or backend servers are used.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Run Automated Unit Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 📐 Architecture & Key Calculations

AquaAudit is structured into pure, unit-testable TypeScript calculation modules, dedicated authentication services, report managers, and modern React dashboard components:

```text
aquaaudit/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # Collapsible desktop/mobile navigation drawer
│   │   ├── Header.tsx           # Top bar with property status & profile dropdown
│   │   ├── DataPanel.tsx        # Step 1: Simulator controls & CSV uploader
│   │   ├── ResultPanel.tsx      # Step 2: Key metrics, alert card & cost inputs
│   │   ├── NightFlowChart.tsx   # Recharts timeline with baseline & flagged nights
│   │   ├── InspectionTicket.tsx # Step 3: Interactive checklist & save report
│   │   ├── DetectionTest.tsx    # 540-run robustness benchmark table
│   │   ├── OnboardingModal.tsx  # 3-step first-use walkthrough guide
│   │   └── LogoutConfirmModal.tsx# Unsaved work confirmation modal
│   ├── pages/
│   │   ├── LoginPage.tsx        # Sign-in with password toggle & instant Demo Mode
│   │   ├── SignupPage.tsx       # Account creation with property credentials
│   │   ├── ForgotPasswordPage.tsx# Password recovery interface
│   │   ├── DashboardOverview.tsx# Premium operational dashboard
│   │   ├── ReportsPage.tsx      # Saved report search, filter & CSV export
│   │   ├── SettingsPage.tsx     # Property profile, occupancy & currency setup
│   │   └── HelpPage.tsx         # Operational guide & onboarding tour launcher
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state and session lifecycle
│   ├── lib/
│   │   ├── auth.ts              # Decoupled auth service with honest Demo Mode
│   │   ├── reports.ts           # Isolated per-user report store & CSV exporter
│   │   ├── simulator.ts         # Deterministic PRNG + Box-Muller Gaussian simulator
│   │   ├── validation.ts        # Chronological monotonic validation & CSV parser
│   │   ├── detector.ts          # Median, MAD, threshold & rolling alert rules
│   │   └── detectionTest.ts     # Batch runner for 18 parameter combinations
│   ├── types.ts                 # Strict TypeScript domain types
│   ├── App.tsx                  # Tab routing & state synchronization
│   ├── main.tsx
│   └── index.css
├── public/
│   └── sample-meter-readings.csv
├── README.md
└── package.json
```

---

## 🧮 Mathematical Model & Algorithms

### 1. Overnight Flow Calculation
The overnight window between 11 PM on day `i - 1` and 5 AM on day `i` spans exactly 6 hours:
$$\text{nightFlow}_i = \frac{r\_05[i] - r\_23[i - 1]}{6} \quad (\text{Litres / hour})$$

- Missing readings (`null`) are preserved as `null` and never coerced to 0.
- Decreasing readings are flagged as invalid and excluded from overnight calculations.

### 2. Baseline and Anomaly Threshold (MAD)
To detect leaks without assuming a bell curve, AquaAudit uses the **Median Absolute Deviation (MAD)**:
- Maintains a chronological history of normal (unflagged) night flows.
- During the **learning phase** (first 5 normal nights), no flags are raised.
- Once $\ge 5$ normal nights exist, the detector inspects the most recent 14 normal values:
  $$\text{baseline} = \text{median}(\text{last 14 normal nights})$$
  $$\text{MAD} = 1.4826 \times \text{median}(|\text{nightFlow}_j - \text{baseline}|)$$
  $$\text{threshold} = \text{baseline} + \max(3 \times \text{MAD}, 10)$$
- A night is flagged when:
  $$\text{nightFlow}_i > \text{threshold}$$

### 3. Baseline Protection
When a night is flagged as an anomaly, it is **never added** to `normalHistory`. This prevents active leaks from contaminating the baseline and raising the threshold.

### 4. 7-Day Persistent Alert Rule
Transient spikes (e.g. a student filling a bucket at 2 AM) should not trigger a false alarm. The detector inspects the rolling 7-day window $[i - 6, i]$:
- Let $\text{validFlags}$ = number of days with a flag decision ($\ne \text{null}$).
- Let $\text{flaggedCount}$ = number of flagged nights in the window.
- An alert is generated if:
  $$\text{validFlags} \ge 3 \quad \text{AND} \quad \text{flaggedCount} \ge 3 \quad \text{AND} \quad \frac{\text{flaggedCount}}{\text{validFlags}} \ge 0.6$$
- **Confidence**: `High` if $\text{flaggedCount} \ge 5$, otherwise `Medium`.

### 5. Loss & Cost Estimations
- **Extra Night Flow**: Median of $(\text{nightFlow} - \text{baseline})$ over the most recent 7 flagged nights.
- **Estimated Daily Loss**: $\text{extraNightFlow} \times 24 \text{ hours}$.
- **Estimated Monthly Cost**: $(\text{estimatedDailyLoss} \times 30 / 1000) \times \text{waterPrice}$ (in INR ₹).

---

## 🧪 Robustness Evaluation (Detection Test)

The built-in detection test evaluates 540 deterministic browser simulations:
- **Planted leak sizes:** 0, 10, 20, 50, 100, 200 L/hour (starting day 30)
- **Missed reading rates:** 0%, 20%, 40%
- **30 seeded runs per combination** ($6 \times 3 \times 30 = 540$ runs)
- **Detection Rate:** Evaluates whether an alert triggered within days 30–43 inclusive.
- **False Alarm Rate:** Evaluates whether any alert occurred in 60-day leak-free trials.

---

## 📁 CSV Upload Specifications

You can upload real meter records using a CSV with columns:
```csv
day,r_23,r_05
1,100000,100120
2,100250,100310
3,,100500
```
- Missing cells are treated as missing readings (`null`), not zero.
- Re-check warnings are displayed if a meter reading is lower than an earlier recorded reading.

---

## 🛡️ Mandatory Operational Notice

- **This tool flags likely water loss; it does not locate the leak or prove one exists.**
- **Numbers from the simulator are not real-world performance.**
