# 💰 Personal Finance Tracker

A simple yet powerful personal finance tracker built with React and Firebase. Track your income and expenses by category and date, view your current bank balance, and manage your finances all in one place.

## ✨ Features

- 🔐 User authentication (Firebase Auth)
- 💼 Income & Expense tracking with categories
- 📅 Daily record selection and review
- 📊 Auto-calculated daily and total bank balance
- 🧾 View and update initial bank balance
- 🛠️ Real-time Firestore integration
- 💻 Responsive and clean UI

## 📸 Screenshots

Coming soon!

## 🔧 Tech Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Firebase (Firestore, Auth)

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Install Dependencies
bash
Copy
Edit
npm install
3. Configure Firebase
Create a .env file in the root and add your Firebase config:

env
Copy
Edit
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
Note: Never commit your .env file. It’s ignored in .gitignore.

4. Run the App
bash
Copy
Edit
npm run dev
The app should now be running at http://localhost:5173

📁 Folder Structure (Simplified)
bash
Copy
Edit
src/
├── components/       # Reusable components
├── firebase/         # Firebase config
├── pages/            # Page components like Income, Expense, Settings
├── App.jsx
├── main.jsx
🛡️ Security & Environment
Firebase credentials are stored securely using .env variables.

Sensitive files like .env are listed in .gitignore.

📌 Todo
Add export/reporting options (PDF/CSV)

Monthly summaries and charts

Dark mode toggle 🌙

📃 License
This project is licensed under the MIT License.
