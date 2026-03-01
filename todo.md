# StarConnect - Implementation To-Do List

## 1. Project Setup
- [ ] Initialize React + Vite project with TypeScript.
- [ ] Install dependencies: TailwindCSS, Framer Motion, Swiper.js, Recharts, Axios.
- [ ] Set up Node.js + Express backend.
- [ ] Initialize MySQL database and configure Prisma ORM.
- [ ] Set up environment variables (`.env`) for secrets, database connection, and JWT.

## 2. Database & Backend API
- [ ] Create database schema using Prisma:
  - [ ] `stars` table (id, name, category, country, short_bio, full_bio, image_url, availability_status).
  - [ ] `contact_requests` table (id, full_name, company, email, phone, country, star_id, event_type, event_date, message).
  - [ ] `analytics_events` table (id, event_type, page, star_id, country, device_type).
- [ ] Implement REST API endpoints:
  - [ ] `GET /api/stars` (Fetch stars for carousel).
  - [ ] `POST /api/contact` (Submit meeting request).
  - [ ] `GET /api/analytics` (Fetch data for admin dashboard).
- [ ] Implement JWT authentication for admin routes.
- [ ] Implement rate limiting middleware for form submissions and API protections.
- [ ] Integrate Nodemailer to send email notifications to the admin on new contact requests.

## 3. Design System & Frontend Architecture
- [ ] Configure Tailwind theme settings (`tailwind.config.js`) for a light-based premium look:
  - [ ] Colors: Background (#ffffff), Accent (Soft gold/champagne), Secondary (Light beige/cream), Text (Dark charcoal).
- [ ] Define global CSS for cinematic spacing, elegant typography, and layout structure.
- [ ] Set up React Router for navigation between the Landing Page and Admin Portal.

## 4. Feature: Cinematic Hero Section
- [ ] Create `Hero` component.
- [ ] Add full-width cinematic video background OR subtle animated light gradient.
- [ ] Implement smooth fade-in animation for headline: "Connect With Global Icons".
- [ ] Implement animation for subheadline: "Book. Meet. Collaborate."
- [ ] Add and style CTA Buttons: "Explore Stars" and "Request a Meeting" (gold gradient or soft black).
- [ ] Apply smooth scroll reveal and elegant fade transitions.

## 5. Feature: Star Carousel Section
- [ ] Create `StarCarousel` component using `Swiper.js`.
- [ ] Design the individual premium star card:
  - [ ] Soft shadows, light theme (white background), and gold/neutral accents.
  - [ ] Display Image, Name, Category, Country, Short description.
  - [ ] Add "Request Booking" CTA button.
- [ ] Fetch star data from the backend and render cards dynamically.
- [ ] Implement lazy loading for star images.
- [ ] Implement Modal View functionality:
  - [ ] Open modal on card click.
  - [ ] Display larger image, full biography, tags, and availability status.
  - [ ] Include Contact CTA inside the modal.

## 6. Feature: Booking / Contact Request Form
- [ ] Create `ContactForm` component.
- [ ] Build form fields: Full Name, Company Name, Email, Phone Number, Country, Star Selected (dropdown), Event Type, Proposed Date, Message.
- [ ] Implement frontend form validation.
- [ ] Add anti-spam protection (optional CAPTCHA or honeypot).
- [ ] Implement form submission handler to POST data to the backend.
- [ ] Display a premium success animation or toast message after successful submission.

## 7. Feature: Global Access Section
- [ ] Create `GlobalAccess` component explaining the platform's core values.
- [ ] Add premium icon animations for:
  - [ ] Global representation.
  - [ ] Secure communication.
  - [ ] Verified talent network.
  - [ ] Discretion & professionalism.

## 8. Feature: Minimal Admin Portal (Analytics + Tracking)
- [ ] Create secure `AdminLogin` page with JWT authentication flow.
- [ ] Create `AdminDashboard` layout (protected route).
- [ ] Fetch analytics data from the backend.
- [ ] Display summary statistics cards:
  - [ ] Total page views, Unique visitors, Total contact requests, Requests per star, Requests per country.
- [ ] Implement `Recharts` data visualizations:
  - [ ] Line chart: Visits over time.
  - [ ] Bar chart: Contact requests per star.
  - [ ] Pie chart: Country distribution.

## 9. Performance & Security Optimization
- [ ] Optimize all images and ensure lazy loading is applied application-wide.
- [ ] Set up API caching strategies for frequently accessed data (like the stars list).
- [ ] Validate and sanitize all user inputs on the backend to prevent SQL injection and XSS.
- [ ] Conduct Lighthouse performance testing (target score 90+ for performance, accessibility, SEO, best practices).
