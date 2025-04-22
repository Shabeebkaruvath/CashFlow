import { Outlet, NavLink } from 'react-router-dom'
import { Home, DollarSign, ArrowDownCircle, Settings } from 'lucide-react'

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Income', path: '/income', icon: DollarSign },
  { name: 'Expense', path: '/expense', icon: ArrowDownCircle },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export default function Layout() {
  return (
    <>
      {/* Mobile Top Logo */}
      <div className="md:hidden w-full text-center bg-white shadow py-2 z-50 fixed top-0 left-0">
        <h1 className="text-xl font-bold text-blue-600">CashFlow</h1>
      </div>

      {/* Desktop Top Navbar */}
      <nav className="hidden lg:flex fixed top-0 left-0 w-full bg-white shadow z-50 px-8 py-4 items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">CashFlow</h1>
        <ul className="flex space-x-8 items-center">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 font-medium transition ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  } hover:text-blue-500`
                }
              >
                <item.icon size={22} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tablet Sidebar Navbar */}
      <nav className="hidden md:flex lg:hidden fixed top-0 left-0 h-full w-20 bg-white shadow z-50 flex-col items-center py-6 space-y-6">
        <div className="text-blue-600 text-lg font-bold rotate-90 whitespace-nowrap mb-8">
          CashFlow
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-sm font-medium transition ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              } hover:text-blue-500`
            }
          >
            <item.icon size={24} />
            <span className="text-xs">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <div className="pt-16 md:pt-0 lg:pt-20 px-4 sm:px-6 md:ml-20 lg:ml-0 max-w-7xl mx-auto">
        <Outlet />
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow z-50">
        <ul className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center text-xs font-medium transition ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  } hover:text-blue-500`
                }
              >
                <item.icon size={22} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
