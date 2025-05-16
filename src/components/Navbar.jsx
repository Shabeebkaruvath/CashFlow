import { Outlet, NavLink } from "react-router-dom";
import { Home, DollarSign, ArrowDownCircle, Settings } from "lucide-react";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Income", path: "/income", icon: DollarSign },
  { name: "Expense", path: "/expense", icon: ArrowDownCircle },
  { name: "Settings", path: "/settings", icon: Settings },
];
export default function Layout() {
  return (
    <>
     {/* Universal Header */}
<header className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
  <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 py-3">
    <div className="flex items-center space-x-3">
      <span className="text-blue-600 text-3xl font-semibold"><a href="/">CashFlow</a></span>
    </div>

    {/* Desktop Navigation */}
    <nav className="hidden lg:flex items-center space-x-6">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-2 text-sm font-medium transition-colors ${
              isActive ? "text-blue-600" : "text-gray-700"
            } hover:text-blue-500`
          }
        >
          <item.icon size={18} />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>

    
  </div>
</header>

{/* Tablet Sidebar */}
<aside className="hidden md:flex lg:hidden fixed top-0 left-0 h-full w-16 bg-white border-r border-gray-200 z-40 pt-20 flex-col items-center space-y-6">
  {navItems.map((item) => (
    <NavLink
      key={item.name}
      to={item.path}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center text-[11px] font-medium transition-colors ${
          isActive ? "text-blue-600" : "text-gray-500"
        } hover:text-blue-500`
      }
    >
      <item.icon size={20} />
      <span className="mt-1">{item.name}</span>
    </NavLink>
  ))}
</aside>

{/* Mobile Top Bar */}
<div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow-sm z-40 py-3 px-4 flex justify-between items-center">
  <span className="text-blue-600 text-3xl font-semibold">CashFlow</span>
  <button className="text-gray-600 hover:text-blue-600 focus:outline-none">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</div>


      {/* Main Content */}
      <div className="pt-12 md:pt-0 lg:pt-16 px-4 sm:px-6 md:ml-16 lg:ml-0 max-w-7xl mx-auto">
        <Outlet />
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white z-50 shadow-lg rounded-t-3xl overflow-hidden">
        <div className="px-4 py-4">
          <ul className="flex justify-around items-center">
            {navItems.map((item) => (
              <li key={item.name} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className={() => {
                    const baseClasses =
                      "flex items-center transition-all duration-200 ease-in-out";
                    return baseClasses;
                  }}
                >
                  {({ isActive }) =>
                    isActive ? (
                      <div className="bg-blue-50 rounded-full px-6 py-3 flex items-center">
                        <item.icon size={24} className="text-blue-600" />
                        <span className="ml-2 text-sm font-medium text-blue-600">
                          {item.name}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-3">
                        <item.icon size={24} className="text-gray-800" />
                      </div>
                    )
                  }
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
