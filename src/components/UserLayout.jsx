import { useState } from "react";

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Header from "./Header";

import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Home,
  Layers,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function UserLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "Dashboard";
  });

  const menuItems = [
    { name: "Dashboard", icon: Home, href: ".", end: true },

    { name: "Vocabulary", icon: BookOpen, href: "vocabulary" },

    { name: "Dialogues", icon: MessageSquare, href: "dialogues" },

    { name: "Mock Test", icon: ClipboardCheck, href: "mock-test" },

    { name: "Rapid Review", icon: Zap, href: "rapid-review" },

    { name: "Buy Subscriptions", icon: CreditCard, href: "subscriptions" },

    {
      name: "User Subscriptions",
      icon: Layers,
      href: "user-subscriptions",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-gray-100  ">
      <Sidebar
        label="CS Agent"
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        setActiveItem={setActiveItem}
        menuItems={menuItems}
      />
      {/* Main Content */}
      <div className=" sticky top-0 left-0  z-40 rounded-2xl ">
        <Header setIsOpen={setIsOpen} isOpen={isOpen} activeItem={activeItem} />
      </div>
      <div className={`flex-1 flex flex-col overflow-y-auto  bg-gray-100`}>
        <Outlet />
      </div>
    </div>
  );
}
