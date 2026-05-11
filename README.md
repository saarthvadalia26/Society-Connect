# 🏢 Society Connect
### *The Ultimate Management Suite for Modern Residential Societies.*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**Society Connect** is a premium, all-in-one platform designed to streamline Residential Welfare Association (RWA) operations. From automated billing and expense tracking to real-time visitor management and facility booking, it brings transparency and efficiency to gated communities.

---

## 🚀 Core Modules

### 👨‍💼 Admin & Secretary Suite
*   **Automated Billing**: Generate monthly maintenance bills with one click based on flat types or fixed rates.
*   **Financial Reports**: View interactive monthly/yearly collection vs. expense summaries.
*   **Defaulter Tracking**: A "Traffic Light" system to monitor unpaid dues and outstanding balances.
*   **Asset Management**: Comprehensive control over society facilities, flats, and member profiles.
*   **Announcement Center**: Broadcast digital notices to all residents instantly.

### 🏠 Resident Command Center
*   **Personal Ledger**: Full transparency into payment history with digital receipt downloads.
*   **Facility Booking**: Reserve clubhouses, gyms, or courts with real-time availability checks.
*   **Digital Help Desk**: File maintenance complaints with photo attachments and track resolution status.
*   **Guest Invitations**: Generate secure entry codes for visitors to bypass manual gate entry.

### 🛡️ Security & Guard Portal
*   **Visitor Verification**: Quick entry/exit logging via secure 6-digit codes.
*   **Live Logs**: Real-time monitoring of personnel moving through the gate for enhanced safety.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **State Management**: Server Actions & React Hooks
*   **Notifications**: [Sonner](https://sonner.stevenly.ai/) for sleek toasts

---

## 🏗️ Architecture & Project Structure

```text
├── app/                  # Next.js App Router
│   ├── admin/            # Secretary/Manager workflows (Bills, Reports, Members)
│   ├── resident/         # Homeowner/Tenant workflows (Ledger, Bookings, Complaints)
│   ├── guard/            # Security gate interface (Visitor Logs)
│   └── (auth)/           # Secure Login, Register, Forgot Password
├── components/           # Shared UI components (Charts, Forms, Layouts)
├── lib/                  # Business logic & Supabase client
│   ├── db.ts             # Data access layer (Supabase-backed)
│   ├── auth.ts           # Auth utilities & Role-based access
│   └── types.ts          # TypeScript interfaces
└── supabase/             # DB schema & initialization
```

---

## 🏁 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   A Supabase Project

### 2. Installation
```bash
git clone https://github.com/saarthvadalia26/Society-Connect.git
cd Society-Connect
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

### 4. Run Development
```bash
npm run dev
```

---

## 🎨 Design Philosophy
Society Connect features a **Premium High-Contrast Dark Mode** interface. Every component—from the financial charts to the visitor logs—is optimized for readability and a modern professional aesthetic.

---

## 👤 Author
**Saarth Vadalia**
*   GitHub: [@saarthvadalia26](https://github.com/saarthvadalia26)
