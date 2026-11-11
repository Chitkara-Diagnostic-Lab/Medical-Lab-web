"use client"

import * as React from "react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { TestTube, Heart } from "lucide-react"  // MediBook icons

export function CompanyHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          size="lg" 
          className="justify-start p-4 data-[state=open]:bg-sidebar-accent"
        >
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 flex aspect-square size-10 items-center justify-center rounded-xl shadow-lg mr-3">
            <TestTube className="size-5 text-white" />
          </div>
          <div className="grid text-left">
            <span className="truncate font-bold text-lg leading-tight">CHITKARA</span>
            <span className="truncate text-xs text-muted-foreground font-medium">Lab Management</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
