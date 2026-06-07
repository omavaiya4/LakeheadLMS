# LakeheadLMS 📚

> **CS5450 Mobile Programming — Challenge 3**
> Group #1: Education / LMS Portal — Lakehead University

---

## 📱 Overview

**LakeheadLMS** is a full-featured Education/LMS mobile portal built with **React Native (Expo)** and **Firebase**. The app supports two user roles — **Student** and **Instructor** — each with a personalized dashboard, course management, grade tracking, announcements, search, and secure Firebase authentication.

---

## 👥 Group Members

| Student ID | Name |
|------------|------|
| 1312122 | Aadil, Luqman |
| 1339707 | Sahil |
| 1307462 | ELDELNGATY, ABDELRAHMAN M |
| 1338099 | OMAR ALI, AHMED |
| 1311002 | ANUJIN, SAINZOLBOO |
| 1297799 | Arora, Pranay Rajesh |
| 1340827 | Avaiya, Om Jayeshbhai |
| 1332900 | Avecillas Segovia, Danilo Nicolas |
| 1296844 | Juntao Wen |

---

## ✨ Features

- 🔐 **User Registration & Login** — Firebase Email/Password Auth with role selection (Student / Instructor)
- 🏠 **Personalized Dashboard** — Students see enrolled courses & GPA; Instructors see teaching courses
- 📚 **Course Management** — Instructors create courses; Students browse and enroll
- 📊 **Grade Tracking** — Instructors enter grades (assignment / quiz / midterm / final); Students view letter grades and GPA
- 📢 **Announcements** — Instructors post per-course announcements visible to enrolled students
- 🔍 **Search** — Search across courses, students, and announcements with filter chips
- 👤 **Profile** — View and edit name, department with role badge
- 📱 **Responsive Design** — Optimized for Android phones and tablets

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.74.2 | Cross-platform mobile framework |
| Expo | ~51.0.0 | Build toolchain and dev environment |
| Expo Router | ~3.5.14 | File-based navigation |
| TypeScript | ~5.3.3 | Type-safe development |
| Firebase Auth | ^10.12.2 | User authentication |
| Firebase Firestore | ^10.12.2 | NoSQL cloud database |
| Expo Linear Gradient | ~13.0.2 | UI gradient effects |
| @expo/vector-icons | ^14.0.0 | Ionicons icon set |

---

## 📁 Project Structure

```
LakeheadLMS/
├── app/
│   ├── _layout.tsx             # Root layout + AuthProvider + navigation guard
│   ├── auth/
│   │   ├── login.tsx           # Login screen
│   │   └── register.tsx        # Register screen (role selection)
│   ├── tabs/
│   │   ├── dashboard.tsx       # Personalized dashboard
│   │   ├── courses.tsx         # Course list, create, enroll
│   │   ├── grades.tsx          # Grade tracker
│   │   ├── search.tsx          # Global search
│   │   └── profile.tsx         # User profile & edit
│   └── course/
│       └── [id].tsx            # Course detail: overview, announcements, students
├── components/
│   └── BottomNav.tsx           # Shared bottom navigation bar
├── constants/
│   ├── Colors.ts               # App-wide color palette
│   └── firebase.ts             # Firebase initialization
├── hooks/
│   └── useAuth.tsx             # Auth context: login, register, logout
├── assets/                     # Icons, splash screen
├── app.json                    # Expo configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Email/Password** under Authentication → Sign-in method
3. Create a **Firestore Database** (start in test mode)
4. Register a Web App and copy the config
5. Open `constants/firebase.ts` and replace the placeholder values:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Firestore Collections

| Collection | Fields |
|------------|--------|
| `users` | uid, email, name, role, studentId, department |
| `courses` | title, code, credits, instructor, instructorId, enrolledStudents[] |
| `grades` | courseCode, assignmentName, score, maxScore, type, studentId |
| `announcements` | title, body, courseId, courseCode, instructorId, createdAt |

---

## 🚀 Installation & Running

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [Android Studio](https://developer.android.com/studio) with an AVD emulator configured
- Expo CLI: `npm install -g expo-cli`

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/omavaiya4/LakeheadLMS.git
cd LakeheadLMS

# 2. Install dependencies
npm install

# 3. Add your Firebase config to constants/firebase.ts

# 4. Start the Expo dev server
npx expo start

# 5. Press 'a' to launch on Android emulator
```

### Run on Physical Device (+2 bonus marks)
1. Install **Expo Go** from the Google Play Store
2. Connect your phone to the same Wi-Fi as your laptop
3. Scan the QR code shown in the terminal

---

## 📲 App Demo Flow

1. Register as an **Instructor** → create a course
2. Log out → Register as a **Student** → enroll in the course
3. Log back in as Instructor → add a grade for the student
4. Log back in as Student → view grade and GPA
5. Instructor posts an announcement → Student sees it in the course detail
6. Use Search to find courses, students, or announcements

---

## 📋 Grading Criteria

| Criterion | Implementation |
|-----------|---------------|
| Programming (React Native/Expo) | Full TypeScript + Expo Router + Firebase SDK |
| Functionalities | All screens functional on Android emulator |
| App Design & Responsive Design | Lakehead-branded theme, bottom nav, cards, gradients |
| Security | Firebase Auth + Firestore rules + navigation guard |
| Search | Global search across courses, students, announcements |

---

*Lakehead University · CS5450 Mobile Programming · Challenge 3 · Group #1*
