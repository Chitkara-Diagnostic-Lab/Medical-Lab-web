import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  TestTube, 
  Users, 
  Settings,
  Upload,
  ClipboardList,
  UserCog,
  LucideIcon
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

// User (Patient) Navigation
export const userNavigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/me/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "My Profile",
        href: "/me/profile",
        icon: Users,
      },
    ],
  },
  {
    title: "Tests & Bookings",
    items: [
      {
        title: "Browse Tests",
        href: "/tests",
        icon: TestTube,
      },
      {
        title: "My Bookings",
        href: "/me/bookings",
        icon: Calendar,
      },
      {
        title: "Test Reports",
        href: "/me/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Settings",
        href: "/me/settings",
        icon: Settings,
      },
    ],
  },
]

// Lab Staff Navigation
export const labNavigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/lab/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Work Queue",
    items: [
      {
        title: "Assigned Tests",
        href: "/lab/assigned",
        icon: ClipboardList,
      },
      {
        title: "Upload Report",
        href: "/lab/upload",
        icon: Upload,
      },
    ],
  },
]

// Admin Navigation
export const adminNavigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Tests Catalog",
        href: "/admin/tests",
        icon: TestTube,
      },
      {
        title: "All Bookings",
        href: "/admin/bookings",
        icon: Calendar,
      },
      {
        title: "All Reports",
        href: "/admin/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Lab Staff",
        href: "/admin/staff",
        icon: UserCog,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
]

// Helper to get navigation based on role
export function getNavigationForRole(role: string): NavSection[] {
  switch (role) {
    case "admin":
      return adminNavigation
    case "lab_staff":
      return labNavigation
    case "user":
    default:
      return userNavigation
  }
}