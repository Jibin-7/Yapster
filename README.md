<div align="center">
  <img src="https://ui-avatars.com/api/?name=Yapster&background=000&color=fff&size=100" alt="Yapster Logo" width="100" height="100" style="border-radius: 20px;" />
  
  # Yapster
  
  **A Premium, Real-Time Progressive Web Application**

  [![Live Demo](https://img.shields.io/badge/Live_Demo-yapster--eta.vercel.app-000000?style=for-the-badge&logo=vercel)](https://yapster-eta.vercel.app)
  
  <br />

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Pusher](https://img.shields.io/badge/Pusher-300D4F?style=flat-square&logo=pusher&logoColor=white)](https://pusher.com/)
  [![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
</div>

<br />

## 🌟 Overview

Yapster is a full-stack social media platform engineered from the ground up to showcase modern web development capabilities. Moving beyond standard CRUD applications, Yapster utilizes a decoupled client-server architecture to deliver instantaneous WebSocket communication, deep relational data mapping on a NoSQL database, and a highly responsive, physics-based user interface.

Most importantly, Yapster is a fully configured **Progressive Web App (PWA)**, allowing users to install the application natively on their iOS, Android, or Desktop devices directly from the browser.

## ✨ Core Features

### ⚡ Real-Time Engine (Pusher)
Traditional social media platforms rely on inefficient HTTP polling. Yapster implements persistent WebSocket connections using Pusher. When a user sends a message or interacts with a post, the Node.js serverless API triggers an event that pushes the payload to the recipient's client in milliseconds, updating the React state without a page refresh.

### 📱 Progressive Web App (PWA)
By implementing Service Workers and a Web App Manifest, Yapster achieves a native mobile feel. It intelligently caches assets for lightning-fast subsequent loads and runs in a standalone display mode that hides the Safari/Chrome browser UI on mobile devices.

### 🔒 Secure Authentication Pipeline
Session state is strictly managed using NextAuth.js. Yapster supports both encrypted credential logins (passwords are salted and hashed using `bcryptjs`) and seamless Google OAuth 2.0 integration, utilizing HTTP-only cookies and JSON Web Tokens (JWT) to prevent XSS attacks.

### 🗄️ Complex Data Modeling
Built on MongoDB and Mongoose, the database utilizes advanced Object Data Modeling (ODM). Features like follower/following networks, private profiles, threaded comments, and post likes require highly relational queries, efficiently executed through Mongoose `populate` aggregations.

### ☁️ Optimized Media Delivery
To prevent server bottlenecks and timeout errors, large image uploads bypass the Next.js API entirely. The client directly interfaces with the Cloudinary CDN via secure upload presets, processing the image at the edge and returning a lightweight URL string to MongoDB.

## 🎨 UI & UX Design

The user interface was constructed with a rigorous mobile-first methodology using **Tailwind CSS**. 

- **Responsive Architecture:** A persistent sidebar on desktop smoothly collapses into a sleek bottom-navigation bar on mobile devices.
- **Adaptive Theming:** Deep integration of Tailwind's `dark:` variant ensures the application flawlessly respects the user's system color scheme preferences (Dark/Light mode) without hydration flickering.
- **Micro-Animations:** Strategic implementation of **Framer Motion** adds physics-based spring animations to dropdowns, modals, and page transitions, elevating the perceived quality of the software.

## 🏗️ System Architecture

1. **Client Layer:** Next.js App Router utilizes React 18 Server Components for static layouts (maximizing SEO and FCP speed) while reserving the `"use client"` directive for highly interactive islands of state (like feeds and chat logs).
2. **API Layer:** Next.js Serverless Functions (`/api/posts`, `/api/messages`) act as the secure bridge, processing raw HTTP requests.
3. **Database Layer:** The API authenticates the session, validates payloads, and executes strict CRUD operations on the MongoDB Atlas cluster.
4. **Broadcast Layer:** The API concurrently sends payloads to the Pusher WebSocket cluster, which handles fan-out broadcasting to all subscribed clients.

---

<div align="center">
  <i>Designed and Engineered by Jibin Saju Joseph</i>
</div>
