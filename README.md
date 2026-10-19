# 🌱 AgriSense — Agriculture Management System

A responsive, frontend-based Agriculture Management System built with **React.js, Vite, Bootstrap, and JavaScript**. AgriSense provides a centralized dashboard to manage crops, buyers, harvest orders, and farm-related information.

## 📌 Project Overview

AgriSense is designed to simplify agricultural record management through an interactive dashboard. It helps users organize crop information, monitor crop health scores, manage buyer records, track harvest orders, and review farm statistics.

This project was developed as part of the **U Devs — Batch 6 Full Stack Development Internship Task**.

## ✨ Features

### 📊 Dashboard
- Overview of total crops and active fields
- Expected harvest and pending order statistics
- Harvest production chart
- Crop health indicators
- Harvest schedule

### 🌾 Crop Management
- Add, view, edit, and delete crop records
- Store crop name, field, planting date, and cutting date
- Track expected and harvested quantities
- Record crop health scores and statuses
- Search, filter, and sort crop records

### 👥 Buyer Management
- Add, view, edit, and delete buyer records
- Validate buyer names
- Automatic CNIC formatting and duplicate checking
- Image upload with file type and size validation
- Image preview
- Search buyers by name or CNIC

### 📦 Harvest & Order Management
- Create and manage harvest orders
- Select crops and buyers from saved records
- Validate order quantities against available stock
- Track pending, completed, and cancelled orders
- Search and filter orders
- Preserve records after page refresh

### 📱 Responsive Interface
- Responsive dashboard layout
- Navigation with React Router
- Reusable components
- Bootstrap-based styling
- Responsive tables and cards

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Component-based user interface |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| HTML5 | Page structure |
| CSS3 | Custom styling |
| Bootstrap | Responsive layout and UI styling |
| React Router | Client-side navigation |
| Recharts | Dashboard charts |
| Lucide React | Icons |
| Browser localStorage | Client-side data persistence |
| Git & GitHub | Version control and source code hosting |

## 📂 Project Structure

```text
agri-management-system/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── dashboard/
│   ├── data/
│   │   └── dataModels.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Crops.jsx
│   │   ├── HarvestOrders.jsx
│   │   ├── Buyers.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   ├── storageService.js
│   │   ├── orderUtils.js
│   │   └── dashboardStats.js
│   ├── styles/
│   │   └── custom.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```


## 💾 Data Storage

AgriSense uses browser `localStorage` to store crop records, buyer records, and harvest orders.

- No backend server is required.
- No database setup is required.
- Data persists in the same browser until it is cleared.
- Data is browser-specific and is not automatically synchronized across users or devices.

**Important:** This project is intended as a frontend demonstration. Browser localStorage is not suitable for securely storing sensitive real-world buyer information.

## 🌦️ Weather Integration

The project includes a weather integration workflow using a free weather API, if enabled in the current build.

Weather data requires an internet connection. Availability and displayed weather fields depend on the implemented API integration.

## 🖼️ Screenshots


1. Dashboard
2. Crop Management
3. Buyer Management
4. Harvest & Order Management
5. Responsive mobile layout

## 🔮 Future Improvements

- Advanced crop health analytics
- Automated farm alerts and notifications
- CSV export for buyer and order records
- Extended harvest and sales analytics
- Improved weather forecasts
- Automated unit and component testing

## 🎯 Learning Outcomes

Through this project, I practiced:

- Building reusable React components
- Managing application state with React hooks
- Implementing CRUD operations
- Validating forms and user input
- Working with browser localStorage
- Creating charts and dashboard statistics
- Implementing client-side routing
- Building responsive interfaces with Bootstrap
- Managing source code with Git and GitHub

## 👩‍💻 Author

**Anaya Sabtain**

Frontend Development | React.js | JavaScript

- Live Link: https://agri-management-system-anaya-sabtai.vercel.app/
- LinkedIn: https://www.linkedin.com/in/anayasabtain/

## 🏢 Internship

**U Devs — Batch 6**

Full Stack Development Internship Task

