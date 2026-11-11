# Medi-Book - Chitkara Diagnostic Pvt Ltd

A modern medical lab testing booking platform built with Next.js 16, featuring user authentication, test booking, and report management.

---

## 📋 Project Overview

**Medi-Book** is a comprehensive diagnostic center management system for **Chitkara Diagnostic Pvt Ltd**. It allows users to:
- Create accounts and sign in securely
- Browse available lab tests
- Book appointments for sample collection
- View and download reports

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety |
| Prisma | ^7.2.0 | ORM with PostgreSQL adapter |
| Better Auth | ^1.4.10 | Authentication library |
| Tailwind CSS | ^4 | Styling |
| Radix UI | Various | UI components |
| React Hook Form | ^7.70.0 | Form handling |
| Zod | ^4.3.5 | Schema validation |
| Sonner | ^2.0.7 | Toast notifications |
| pnpm | - | Package manager |

---

## 📁 Project Structure

```
medi-book/
├── generated/
│   └── prisma/           # Auto-generated Prisma client
│       ├── client.ts
│       ├── models.ts
│       └── models/       # Individual model types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── public/               # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/       # Auth route group
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── actions/      # Server actions
│   │   │   └── auth-serv.ts
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/   # Better Auth API route
│   │   |
│   │   └── me/
│   │       └── dashboard/     # User dashboard
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── logout-btn.tsx
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── auth.ts           # Better Auth server config
│   │   ├── auth-cilent.ts    # Better Auth client config
│   │   ├── prisma.ts         # Prisma client instance
│   │   ├── session.ts        # Session utilities
│   │   └── validation/
│   │       └── auth_zod.ts   # Zod validation schemas
│   └── types/
│       └── auth.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema (Prisma)

### Models

1. **User** - Stores user information
   - Fields: id, email, emailVerified, name, PhoneNumber, image, role
   - Relations: sessions, accounts, bookings

2. **Session** - User sessions for authentication
   - Fields: id, expiresAt, token, userId, ipAddress, userAgent

3. **Account** - OAuth/credential accounts
   - Fields: id, accountId, providerId, userId, accessToken, refreshToken, password

4. **Test** - Available lab tests
   - Fields: id, name, description, price, duration, category, isActive

5. **Booking** - Test booking records
   - Fields: id, userId, testId, collectionDate, collectionTime, status

6. **Report** - Test reports
   - Related to Booking

7. **Verification** - Email/phone verification tokens

### Enums
- **Role**: USER, ADMIN
- **BookingStatus**: PENDING, CONFIRMED, COMPLETED, CANCELLED

---

## 🔐 Authentication Setup

### Better Auth Configuration

**Server-side** (`src/lib/auth.ts`):
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "USER" }
    }
  },
  trustedOrigins: ["http://localhost:3000"],
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
});
```

**Client-side** (`src/lib/auth-cilent.ts`):
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

---

## 📝 Development History & Issues Resolved

### Migration History (January 2026)

| Date | Migration | Description |
|------|-----------|-------------|
| 2026-01-07 | `20260107220115_init` | Initial database schema |
| 2026-01-08 | `20260108005338_1_01` | First iteration updates |
| 2026-01-08 | `20260108005635_add_email_verified` | Added emailVerified field to User |
| 2026-01-08 | `20260108005945_fixes` | Bug fixes |
| 2026-01-08 | `20260108012942_fixes02` | Additional fixes |
| 2026-01-09 | `20260109202622_add` | Added new features |

---

## 🔥 Git Issues & Resolution Log (January 15-17, 2026)

This section documents the complete journey of Git issues faced and how they were resolved.

### Issue 1: Cannot Switch Branch - Uncommitted Changes

**Error Message:**
```
error: Your local changes to the following files would be overwritten by checkout:
        src/components/login-form.tsx
        src/lib/validation/auth_zod.ts
Please commit your changes or stash them before you switch branches.
```

**Problem:** Tried to switch to `main` branch but had uncommitted local changes.

**Solutions Available:**
```bash
# Option 1: Stash changes (recommended)
git stash
git checkout main
# Later restore with: git stash pop

# Option 2: Commit changes
git add .
git commit -m "WIP: save local changes"
git checkout main

# Option 3: Discard changes (if not needed)
git checkout -- src/components/login-form.tsx src/lib/validation/auth_zod.ts
git checkout main
```

**Action Taken:** Used `git stash` to temporarily save changes.

---

### Issue 2: Merge Conflicts - Unmerged Paths

**Status after git operations:**
```
* Unmerged path src/components/login-form.tsx
* Unmerged path src/lib/validation/auth_zod.ts
```

**Problem:** Files had merge conflicts that needed manual resolution.

**❌ Wrong Approach Tried:**
```bash
git checkout --ours src/components/login-form.tsx src/lib/validation/auth_zod.ts
```

**Error Received:**
```
error: path 'src/components/login-form.tsx' does not have our version
error: path 'src/lib/validation/auth_zod.ts' does not have our version
```

**Why it failed:** The files didn't exist in the current branch before the merge - they were added by the other branch. `--ours` doesn't work when "our" version doesn't exist.

**✅ Correct Approach:**
```bash
# Since files came from the other branch, use --theirs
git checkout --theirs src/components/login-form.tsx src/lib/validation/auth_zod.ts
git add src/components/login-form.tsx src/lib/validation/auth_zod.ts
git commit -m "Resolve merge conflicts"
```

---

### Issue 3: Push Rejected - Non-Fast-Forward

**Error Message:**
```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/Chitkara-Diagnostic-pvt/Medical-web.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart.
```

**Problem:** Local `main` branch was behind the remote `main` branch.

**✅ Solution:**
```bash
# Pull with rebase to integrate remote changes
git pull --rebase origin main

# Then push
git push
```

**⚠️ Alternative (use with caution):**
```bash
# Force push (overwrites remote - dangerous!)
git push --force
```

---

### Issue 4: Detached HEAD State During Rebase

**Error Message:**
```
fatal: You are not currently on a branch.
To push the history leading to the current (detached HEAD) state now, use
    git push origin HEAD:<name-of-remote-branch>
```

**Problem:** During rebase, Git enters a detached HEAD state when resolving conflicts.

**✅ Solution:** Continue resolving conflicts and complete the rebase:
```bash
# After fixing conflicts in files
git add <conflicted-files>
git rebase --continue
```

---

### Issue 5: Merge Conflict in `auth_zod.ts`

**Conflict Content:**
```typescript
<<<<<<< HEAD
export type LoginSchema = z.infer<typeof LoginSchema>;
=======
export type LoginFormData = z.infer<typeof LoginSchema>;
>>>>>>> a25e4e2 (Add login validation and auth features)
```

**Problem:** Two different type names for the same schema inference.

**Analysis:**
- `HEAD` version: `LoginSchema` (❌ Wrong - same name as the const, causes conflict)
- Incoming version: `LoginFormData` (✅ Correct - different name, clear purpose)

**✅ Resolution:**
```typescript
export type LoginFormData = z.infer<typeof LoginSchema>;
```

---

### Issue 6: Merge Conflict in `login-form.tsx`

**Two Different Implementations:**

**Version A (HEAD) - Server Actions Approach:**
```typescript
import { useActionState, useEffect } from "react"
import { signInAction } from "@/app/actions/auth-serv"

const [state, formAction, isPending] = useActionState(signInAction, null);

<form action={formAction}>
  <Input name="email" required disabled={isPending} />
</form>
```

**Version B (Incoming) - React Hook Form + Client Auth:**
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { authClient } from "@/lib/auth-cilent"

const { register, handleSubmit, formState: {errors, isSubmitting} } = useForm<LoginFormData>({
  resolver: zodResolver(LoginSchema)
})

<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register("email")} disabled={isSubmitting} />
  {errors.email && <p className="text-red-500">{errors.email.message}</p>}
</form>
```

**✅ Resolution:** Kept Version B (React Hook Form) because:
1. Client-side validation with Zod
2. Better error handling with individual field errors
3. Uses `authClient.signIn.email()` for direct authentication
4. More control over form state with `isSubmitting`

---

### Issue 7: Rebase Needs All Conflicts Resolved

**Error Message:**
```
src/components/login-form.tsx: needs merge
You must edit all merge conflicts and then mark them as resolved using git add
```

**Problem:** Tried to continue rebase without resolving all conflicted files.

**✅ Solution:**
```bash
# 1. Fix ALL conflicted files manually (remove <<<<<<, ======, >>>>>> markers)
# 2. Add all resolved files
git add src/components/login-form.tsx src/lib/validation/auth_zod.ts

# 3. Continue the rebase
git rebase --continue

# 4. Push
git push
```

---

### Summary: Complete Git Workflow for This Scenario

```bash
# 1. If you have uncommitted changes and need to switch branches
git stash

# 2. Switch to target branch
git checkout main

# 3. Pull latest changes with rebase
git pull --rebase origin main

# 4. If conflicts occur, resolve them in your editor
#    - Remove conflict markers (<<<<<<, ======, >>>>>>)
#    - Keep the code you want

# 5. Mark resolved files
git add <file1> <file2>

# 6. Continue rebase
git rebase --continue

# 7. If more conflicts, repeat steps 4-6

# 8. Push when done
git push

# 9. Go back to your branch and restore stashed changes
git checkout <your-branch>
git stash pop
```

---

### Files Changed During This Session

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/validation/auth_zod.ts` | Modified | Fixed type name from `LoginSchema` to `LoginFormData` |
| `src/components/login-form.tsx` | Modified | Switched to React Hook Form implementation |
| `src/components/logout-btn.tsx` | Added | New logout button component |
| `src/app/me/dashboard/page.tsx` | Added | New user dashboard with role-based redirects |
| `src/lib/auth.ts` | Modified | Added `additionalFields.role` config & exported `Session` type |
| `src/lib/session.ts` | Modified | Added `getCurrentUser()` and `requireRole()` functions |
| `src/app/actions/auth-serv.ts` | Modified | Fixed auth approach - needs to use `auth.api` instead of `authClient` |
| `src/types/auth.ts` | Modified | Added `SignInState` type, attempted module augmentation (failed) |

---

## 🔐 Authentication Issues & Resolutions (January 14, 2026)

This section documents authentication-related issues encountered during development and their solutions.

---

### Issue 8: Sign-In Returns "Invalid email or password" but Real Error is Different

**Observed Behavior:**
User enters correct credentials but gets "Invalid email or password" error.

**Console Output:**
```
GET /signin 200 in 537ms (compile: 327ms, render: 210ms)
signInAction called
rahul796547@gmail.com rahul2004
Validation result: {
  success: true,
  data: { email: 'rahul796547@gmail.com', password: 'rahul2004' }
}
POST /api/auth/sign-in/email 403 in 63ms (compile: 28ms, render: 35ms)
Auth response: {
  data: null,
  error: {
    code: 'MISSING_OR_NULL_ORIGIN',
    message: 'Missing or null Origin',
    status: 403,
    statusText: 'FORBIDDEN'
  }
}
POST /signin 200 in 169ms (compile: 8ms, render: 162ms)
```

**Root Cause:**
The `authClient.signIn.email()` was being called from a **Server Action** (`src/app/actions/auth-serv.ts`). Server-side requests don't have an `Origin` header, but Better Auth requires one for CORS/security verification.

**❌ Wrong Approach - Using authClient in Server Action:**
```typescript
// src/app/actions/auth-serv.ts (WRONG)
'use server'

import { authClient } from "@/lib/auth-cilent";  // ❌ Client auth on server

export async function signInAction(prevState, formData) {
    // ...validation...
    
    const {data, error} = await authClient.signIn.email({  // ❌ This fails!
        email: validated.data.email,
        password: validated.data.password
    })
    
    if(error){
        return { error: "Invalid email or password" }  // Generic error hides real issue
    }
}
```

**✅ Correct Approach - Use auth.api directly on server:**
```typescript
// src/app/actions/auth-serv.ts (CORRECT)
'use server'

import { auth } from "@/lib/auth";  // ✅ Server auth

export async function signInAction(prevState, formData) {
    // ...validation...
    
    try {
        const response = await auth.api.signInEmail({  // ✅ Direct server API
            body: {
                email: validated.data.email,
                password: validated.data.password
            }
        });
        
        if(!response || !response.user){
            return { error: 'Invalid email or password' }
        }
        
        return { success: true };
    } catch(error) {
        return { error: 'Invalid email or password' }
    }
}
```

**Alternative Fix - Add baseURL to auth.ts:**
```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",  // ✅ Add this
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
});
```

---

### Issue 9: TypeScript Error - `session.user.role` Property Not Found

**Problem:**
When accessing `session.user.role` in `src/lib/session.ts`, TypeScript throws an error because Better Auth's default types don't include the custom `role` field.

**❌ Wrong Approach 1 - Module Declaration in .ts file:**
```typescript
// src/types/auth.ts (WRONG - causes duplicate identifier error)
import { Role } from "../../generated/prisma/enums"

declare module "better-auth" {
  interface User {
    role: Role;  // ❌ Error: Duplicate identifier 'User'. ts(2300)
  }
}
```

**Error:**
```
Duplicate identifier 'User'. ts(2300)
index.d.mts(47, 1149): 'User' was also declared here.
```

**❌ Wrong Approach 2 - Different module path:**
```typescript
// src/types/auth.ts (WRONG - doesn't work)
declare module "better-auth/types" {
   export interface User {
    role: Role;  // ❌ Doesn't extend the correct interface
  }
}
```

**✅ Correct Approach - Use additionalFields in Better Auth config:**
```typescript
// src/lib/auth.ts (CORRECT)
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: true,
        input: false  // Prevents user from setting role during signup
      }
    }
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
});

// Export inferred Session type for type safety
export type Session = typeof auth.$Infer.Session;
```

**Using the Session type:**
```typescript
// src/lib/session.ts
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession(): Promise<Session | null> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    return session;
}

export async function requireRole(allowedRoles: string[]) {
    const session = await requireAuth();
    // Now TypeScript knows about session.user.role
    if (!allowedRoles.includes(session.user.role)) {
        redirect("/");
    }
    return session;
}
```

---

### Issue 10: Verifying Role is Included in Session

**Question:** Is the `role` field actually being returned in the session?

**Database Schema (prisma/schema.prisma):**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String
  role          Role      @default(USER)  // ✅ Role exists in DB
  // ...other fields
}

enum Role {
  USER
  LAB_STAFF
  ADMIN
}
```

**Verification Method:**
Add logging to check if role appears in session:
```typescript
// src/lib/session.ts
export async function getSession() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    console.log("Session user:", session?.user);  // Check console for role
    return session;
}
```

**Requirements for role to appear in session:**
1. ✅ `role` column exists in database User table
2. ✅ `additionalFields.role` configured in Better Auth
3. ✅ User has a role value in the database
4. Better Auth must include the field when querying user

---

### Authentication Files Summary

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/lib/auth.ts` | Better Auth server config | `auth`, `Session` type |
| `src/lib/auth-cilent.ts` | Better Auth client config | `authClient`, `signIn`, `signOut`, `signUp`, `useSession` |
| `src/lib/session.ts` | Session utilities | `getSession()`, `requireAuth()`, `getCurrentUser()`, `requireRole()` |
| `src/app/actions/auth-serv.ts` | Server actions for auth | `signInAction()` |
| `src/app/api/auth/[...all]/route.ts` | Better Auth API handler | `POST`, `GET` handlers |
| `src/types/auth.ts` | Type definitions | `SignInState` |

---

### Common Issues & Fixes

#### 1. Git Merge Conflict in README
**Issue**: Git merge conflict markers in README.md
```
<<<<<<< HEAD
...
=======
...
>>>>>>> 4bb9f71edb01c0170f97f2439e97918fcc084afc
```
**Fix**: Resolved merge conflict by consolidating both versions

#### 2. Prisma Client Generation Path
**Wrong Path**: `@prisma/client` (default)
**Correct Path**: `../../generated/prisma/client`

```typescript
// ❌ Wrong
import { PrismaClient } from '@prisma/client'

// ✅ Correct
import { PrismaClient } from '../../generated/prisma/client'
```

#### 3. Prisma Adapter Configuration
**Issue**: Using wrong Prisma adapter
**Fix**: Use `@prisma/adapter-pg` with connection string

```typescript
// ✅ Correct setup in src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
```

#### 4. Auth Client File Naming
**Note**: File is named `auth-cilent.ts` (typo: "cilent" instead of "client")
- Path: `src/lib/auth-cilent.ts`
- Consider renaming to `auth-client.ts` for consistency

#### 5. Better Auth API Route
**Correct Path**: `src/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

#### 6. Session Management
**Path**: `src/lib/session.ts`
- Provides `getSession()`, `requireAuth()`, `getCurrentUser()`, `requireRole()`

---

## 📂 Important File Paths Reference

### ✅ Correct Paths

| Purpose | Path |
|---------|------|
| Prisma Schema | `prisma/schema.prisma` |
| Generated Prisma Client | `generated/prisma/client.ts` |
| Auth Server Config | `src/lib/auth.ts` |
| Auth Client Config | `src/lib/auth-cilent.ts` |
| Prisma Instance | `src/lib/prisma.ts` |
| Session Utilities | `src/lib/session.ts` |
| Zod Validation | `src/lib/validation/auth_zod.ts` |
| Auth API Route | `src/app/api/auth/[...all]/route.ts` |
| Server Actions | `src/app/actions/auth-serv.ts` |
| Sign In Page | `src/app/(auth)/signin/page.tsx` |
| Sign Up Page | `src/app/(auth)/signup/page.tsx` |
| User Dashboard | `src/app/me/dashboard/page.tsx` |
| Login Form Component | `src/components/login-form.tsx` |
| Signup Form Component | `src/components/signup-form.tsx` |

### ❌ Common Wrong Paths / Mistakes

| Wrong | Correct |
|-------|---------|
| `@prisma/client` | `../../generated/prisma/client` |
| `src/lib/auth-client.ts` | `src/lib/auth-cilent.ts` (current naming) |
| `src/app/auth/signin` | `src/app/(auth)/signin` |
| `prisma/generated/` | `generated/prisma/` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database (or Prisma Postgres)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd medi-book

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and other configs

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

---

## 📜 Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

---

## 🔄 Validation Schemas

### Signup Schema (`formSchema`)
```typescript
{
  name: string (min 2 chars),
  email: string (valid email),
  password: string (min 8 chars),
  confirmPassword: string (must match password)
}
```

### Login Schema (`LoginSchema`)
```typescript
{
  email: string (valid email),
  password: string (required)
}
```

---

## 📌 Notes & Future Improvements

1. **File Naming**: Consider renaming `auth-cilent.ts` to `auth-client.ts`
2. **Role-Based Access**: Implement admin dashboard with `requireRole(['ADMIN'])`
3. **Test Management**: Add CRUD operations for lab tests
4. **Booking Flow**: Complete booking and payment integration
5. **Report Upload**: Implement report upload and download functionality
6. **Email Verification**: Set up email verification flow
7. **Password Reset**: Implement forgot password functionality

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Developed for **Chitkara Diagnostic Pvt Ltd**

---

*Last Updated: January 17, 2026*

---

## 📝 Changelog

| Date | Changes |
|------|---------|
| Jan 14, 2026 | Identified and documented sign-in `MISSING_OR_NULL_ORIGIN` error |
| Jan 14, 2026 | Fixed auth approach - use `auth.api` instead of `authClient` in server actions |
| Jan 14, 2026 | Added `additionalFields.role` to Better Auth config |
| Jan 14, 2026 | Exported `Session` type from auth.ts |
| Jan 14, 2026 | Attempted module augmentation for User type (documented wrong approaches) |
| Jan 15-17, 2026 | Git workflow issues resolved (merge conflicts, rebase) |
| Jan 17, 2026 | Updated README with complete troubleshooting documentation |
