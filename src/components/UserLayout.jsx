import { useState } from "react";

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Header from "./Header";

import { CreditCard, Home, MessageSquare, Users, Zap } from "lucide-react";

export default function UserLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "Dashboard";
  });

  const menuItems = [
    { name: "Dashboard", icon: Home, href: ".", end: true },
    {
      name: "Practice-Dialogue",
      icon: MessageSquare,
      href: "dialogues",
    },

    { name: "Rapid Review", icon: Zap, href: "rapid-review" },

    { name: "Buy Subscriptions", icon: CreditCard, href: "subscriptions" },
  ];

  return (
    <div className="flex h-screen bg-gray-100  ">
      <Sidebar
        label="CS Agent"
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        setActiveItem={setActiveItem}
        menuItems={menuItems}
      />
      {/* Main Content */}
      <div className={`flex-1 flex flex-col px-4 overflow-auto bg-gray-100`}>
        <div className=" sticky top-0 left-0 py-2 z-40 rounded-2xl ">
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
