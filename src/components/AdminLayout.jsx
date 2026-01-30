import { useState } from "react";

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Header from "./Header";
import {
  Home,
  Languages,
  Globe,
  MessageSquare,
  Layers,
  Users,
  CreditCard,
  ArrowLeftRight,
  MessageCircle,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "Dashboard";
  });

  const menuItems = [
    { name: "Dashboard", icon: Home, href: ".", end: true },

    { name: "Languages", icon: Languages, href: "languages" },

    { name: "Mock Test", icon: ClipboardCheck, href: "mock-test" },

    { name: "Vocabulary", icon: BookOpen, href: "vocabulary" },

    { name: "Users", icon: Users, href: "users" },

    { name: "Subscriptions", icon: CreditCard, href: "subscriptions" },

    { name: "Transactions", icon: ArrowLeftRight, href: "transactions" },

    { name: "User-Messages", icon: MessageCircle, href: "user-messages" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 ">
      <Sidebar
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        setActiveItem={setActiveItem}
        menuItems={menuItems}
      />
      {/* Main Content */}
      <div className={`flex-1 flex flex-col  overflow-auto bg-gray-100`}>
        <div className=" sticky top-0 left-0  z-40  bg-gray-100">
          <Header
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            activeItem={activeItem}
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
