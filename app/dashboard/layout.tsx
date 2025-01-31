"use client";


import Header from "@/components/Header";
import SideBar from "@/components/SideBar";
import { NavigationProvider } from "@/lib/NavigationProvider";


import { Authenticated } from "convex/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <NavigationProvider>
      <div className="flex h-screen">
        <Authenticated>
          <SideBar />
        </Authenticated>

        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      </NavigationProvider>
  );
}