# Society Connect 🏢
### *Modernizing residential welfare through digital integration.*

**Society Connect** is a premium, all-in-one management platform designed specifically to streamline the operations of **Residential Welfare Associations (RWAs)** and gated communities. Built with a focus on ease of use, financial transparency, and community engagement, it bridges the gap between residents and administration.

---

## 🌟 Feature Highlights

### 🌍 Multi-Currency Support
Built for a global residency base, the platform supports smart currency formatting for:
- **INR (₹)**, **USD ($)**, **GBP (£)**, and **EUR (€)**.
- Automatic locale-aware formatting for all financial records and ledgers.

### 🏠 Resident Dashboard
A high-contrast, intuitive command center for Every resident:
- **My Ledger**: Transparent tracking of maintenance dues, payments, and receipts.
- **Help Desk**: Efficient complaint filing and resolution tracking with photo support.
- **Notice Board**: Stay updated with real-time society announcements and digital circulars.

### 🛡️ Visitor Management
Secure and seamless guest handling:
- **Guest Invite**: Generate unique entry codes for visitors ahead of time.
- **Recently Admitted**: Live tracking and history of visitor entries/exits for enhanced security.

### 🛠️ Admin Controls
Comprehensive tools for society secretaries and managers:
- **Secretary Role Transfer**: Smooth digital handover of administrative privileges.
- **Billing Logic**: Automated generation of monthly maintenance bills and penalty calculations.
- **Expense Tracking**: Real-time monitoring of society expenditures with category breakdown.

---

## 💻 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/).
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Storage).
- **Notifications**: [Sonner Toasts](https://sonner.stevenly.ai/) for sleek, non-intrusive alerts.
- **Icons**: [Lucide React](https://lucide.dev/).

---

## 🎨 UI Aesthetic

Society Connect features a **premium high-contrast dark-themed interface**. Every component—from the ledger charts to the visitor logs—is designed for maximum readability and a modern, professional feel.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saarthvadalia26/Society-Connect.git
   cd Society-Connect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 👨‍💻 Author

**Saarth Vadalia** - [GitHub](https://github.com/saarthvadalia26)

---

## 📄 License

This project is licensed under the MIT License.
