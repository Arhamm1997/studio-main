import type { Metadata } from "next";
import Link from "next/link";
import { Home, Info, BotMessageSquare } from "lucide-react";
import "./globals.css";
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bagga Bugs Enhanced",
  description: "Perfect Email System - Beautiful Inbox Delivery with No Limits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <BotMessageSquare className="text-primary w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-semibold text-sidebar-foreground">Bagga Bugs</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/">
                    <SidebarMenuButton tooltip="Dashboard" className="font-medium">
                      <Home />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/instructions">
                    <SidebarMenuButton tooltip="Instructions" className="font-medium">
                      <Info />
                      <span>Instructions</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}

