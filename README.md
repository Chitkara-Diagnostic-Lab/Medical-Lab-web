# Medi-Book – Chitkara Diagnostic Pvt Ltd

Modern diagnostic lab booking platform built with **Next.js 16**, Prisma, PostgreSQL, and Better Auth.

---

## 📋 Project Overview

Medi-Book enables users to:

- Sign up & sign in securely  
- Browse lab tests  
- Book appointments  
- View/download reports  
- Role-based access (USER / ADMIN / LAB_STAFF)

---

## 🛠️ Tech Stack

- Next.js 16 (App Router)  
- React 19 + TypeScript  
- Prisma 7 + PostgreSQL  
- Better Auth  
- Tailwind CSS 4  
- React Hook Form + Zod  
- Radix UI  
- pnpm  

---

## 🗄️ Core Database Models

### User
- id, email, emailVerified, name, phoneNumber, role  
- Relations: sessions, accounts, bookings  

### Session
- id, expiresAt, token, userId  

### Account
- OAuth / credential accounts  

### Test
- id, name, description, price, duration, category, isActive  

### Booking
- id, userId, testId, collectionDate, collectionTime, status  

### Report
- Linked to Booking  

### Verification
- Email/phone tokens  

---

## 🔢 Enums

- **Role** → USER | LAB_STAFF | ADMIN  
- **BookingStatus** → PENDING | CONFIRMED | COMPLETED | CANCELLED  

---

## 🔐 Authentication Architecture

### Server (`src/lib/auth.ts`)
- `betterAuth`
- Prisma adapter (PostgreSQL)
- `emailAndPassword: enabled`
- `additionalFields.role`
- `trustedOrigins`
- Exported inferred `Session` type

### Client (`src/lib/auth-cilent.ts`)
- `createAuthClient`
- Exports: signIn, signUp, signOut, useSession

---

## 🚨 Critical Authentication Fixes

### 1. MISSING_OR_NULL_ORIGIN (403)
**Cause:** Using `authClient.signIn.email()` inside a Server Action.  
Server requests lack Origin header.

**Fix:**  
Use `auth.api.signInEmail()` in server actions.

---

### 2. TypeScript role not recognized
**Wrong:** Manual module augmentation.  
**Correct:** Define `additionalFields.role` in Better Auth config.  
Export inferred `Session` type for strong typing.

---

## 🔁 Git Issues Resolved

- Uncommitted changes → used `git stash`
- Merge conflicts → resolved manually + `git rebase --continue`
- Non-fast-forward push → `git pull --rebase origin main`
- Detached HEAD → complete rebase before pushing

---

## 🧠 Login Implementation Decision

Two approaches:

1. Server Actions + `useActionState`
2. React Hook Form + Zod + authClient  

**Final Choice:** React Hook Form  
**Reasons:**
- Client-side validation
- Better UX
- Field-level error handling
- Cleaner form state control

---

## 📂 Important Paths

- Prisma schema → `prisma/schema.prisma`
- Generated client → `generated/prisma/client.ts`
- Auth server → `src/lib/auth.ts`
- Auth client → `src/lib/auth-cilent.ts`
- Session utils → `src/lib/session.ts`
- Auth API route → `src/app/api/auth/[...all]/route.ts`

---

## ⚠️ Common Mistakes

- Using `@prisma/client` instead of generated client path  
- Calling authClient in server actions  
- Not resolving all rebase conflicts  
- Missing trustedOrigins  

---

## 🚀 Setup

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev