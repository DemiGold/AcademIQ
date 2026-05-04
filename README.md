# 🎓 AcademIQ

AcademIQ is a premium, full-stack Computer-Based Test (CBT) and examination prep platform designed for university students. It features secure passwordless authentication, a custom token-based monetization engine, and a comprehensive admin dashboard for course management.

## ✨ Key Features

* **🔐 Magic Link Authentication:** Secure, passwordless login using Supabase Auth.
* **🪙 Token Engine Monetization:** Custom `ACAD-XXXX-XXXX` token generation system to lock premium content and track paid user access.
* **📝 Dynamic CBT Engine:** Real-time exam environment with timers, immediate grading, and detailed post-exam explanations.
* **👨‍💻 Admin Dashboard:** Dedicated admin portal for bulk-uploading questions via CSV, managing student access levels, and generating access tokens.
* **📱 Fully Responsive UI:** Optimized for both desktop and mobile devices.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), CSS3 (Flexbox/Grid layout)
* **Backend as a Service:** Supabase
* **Database:** PostgreSQL (with Row-Level Security)
* **Authentication:** Supabase OTP (One-Time Password) Magic Links
* **Deployment:** Vercel (Frontend)

## 🚀 Future Roadmap
* Paystack API integration for automated token purchasing.
* Performance analytics and historical score tracking for students.
