# InvoicePro – Invoice Management Web App

A full-featured **Invoice Management System** built using **React**, **Firebase Authentication**, and **Firestore**. This web application allows users to securely **register/login**, **create**, **view**, **print**, and **manage invoices**, with all data stored securely in the cloud.

---

## 🚀 Features

- ✅ **User Authentication** with Firebase (Registration/Login)
- 📝 **Create, View, and Delete** Invoices
- 🔒 **User-Specific Data Access**
- 📄 **Invoice Detail Page** with Print Support
- 🖼️ **Image Preview** on Registration
- 📊 **Dashboard with Chart.js** for Data Visualization
- ⚙️ **User Settings** & Profile Update
- 🌐 **Responsive UI** with Google Fonts & Font Awesome
- 🔃 **Loaders** for Async Operations
- 🧾 **Nested Routing** with React Router
- ☁️ **CORS Fix** for Firebase

---

## 🧩 Project Structure

    src/
    │
    ├── assets/
    │ └── invoice.jpg
    │
    ├── component/
    │ ├── dashboard/
    │ │ ├── Dashboard.js
    │ │ ├── Home.js
    │ │ ├── InvoiceDetail.js
    │ │ ├── Invoices.js
    │ │ ├── NewInvoice.js
    │ │ ├── Setting.js
    │ │ └── dashboard.css
    │ │
    │ ├── login/
    │ │ ├── Login.js
    │ │ └── login.css
    │ │
    │ └── register/
    │ └── Register.js
    │
    ├── App.js
    ├── App.css
    ├── firebase.js
    ├── index.js
    ├── index.css


    
---

## 🛠️ Tech Stack

- **Frontend:** React.js  
- **Routing:** React Router DOM  
- **Authentication & Backend:** Firebase Authentication  
- **Database:** Firestore  
- **Charts:** Chart.js  
- **Styling:** CSS, Google Fonts, Font Awesome  

---

## 🧪 Getting Started (Run Locally)

### 1. Clone the repository


## 2. Install dependencies

  - npm install

## 3. Configure Firebase
  - Update the firebase.js file with your Firebase project configuration:


// Example (replace with your own config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  ...
};

## 4. Start the development server

  - npm start

## 🚀 Deployment
  - The project is live and accessible online. You can also deploy it using:

**Vercel**

**Netlify**

**Firebase Hosting**

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)
![Invoice Detail](screenshots/invoice-detail.png)


🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.


