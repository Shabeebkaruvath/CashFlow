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
  <div className="md:hidden w-full text-center bg-white border-b border-gray-100 py-3 fixed top-0 left-0 z-50">
    <h1 className="text-xl font-semibold text-blue-600">CashFlow</h1>
  </div>

  {/* Desktop Top Navbar */}
  <nav className="hidden lg:flex fixed top-0 left-0 w-full bg-white border-b border-gray-100 z-50 px-8 py-3 items-center justify-between">
    <h1 className="text-xl font-semibold text-blue-600">CashFlow</h1>
    <ul className="flex space-x-6 items-center">
      {navItems.map((item) => (
        <li key={item.name}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-2 font-medium text-sm transition ${
                isActive ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-500`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>

  {/* Tablet Sidebar Navbar */}
  <nav className="hidden md:flex lg:hidden fixed top-0 left-0 h-full w-16 bg-white border-r border-gray-100 z-50 flex-col items-center py-4 space-y-4">
    <div className="text-blue-600 text-lg font-semibold rotate-90 whitespace-nowrap mb-6">
      CashFlow
    </div>
    <ul className="flex flex-col items-center space-y-4">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs font-medium transition ${
              isActive ? 'text-blue-600' : 'text-gray-700'
            } hover:text-blue-500`
          }
        >
          <item.icon size={20} />
          <span className="text-xs">{item.name}</span>
        </NavLink>
      ))}
    </ul>
  </nav>

  {/* Main Content */}
  <div className="pt-12 md:pt-0 lg:pt-16 px-4 sm:px-6 md:ml-16 lg:ml-0 max-w-7xl mx-auto">
    <Outlet />
  </div>

  {/* Mobile Bottom Navbar */}
  <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50">
    <ul className="flex justify-around items-center py-1.5">
      {navItems.map((item) => (
        <li key={item.name}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs font-medium transition ${
                isActive ? 'text-blue-600' : 'text-gray-700'
              } hover:text-blue-500`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
</>
  )
}
