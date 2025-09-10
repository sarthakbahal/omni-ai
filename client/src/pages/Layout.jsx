import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X, Moon, Sun } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import { SignIn, useUser } from '@clerk/clerk-react'
import { useDarkMode } from '../contexts/DarkModeContext'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user } = useUser()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return user ? (
    <div className={`flex flex-col items-start justify-start h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      <nav className={`w-full px-8 min-h-14 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <img 
          className='cursor-pointer w-32 sm:w-44' 
          src={assets.logo} 
          alt="" 
          onClick={() => navigate('/')} 
        />
        
        {/* Mobile menu toggle */}
        {sidebar ? 
          <X onClick={() => setSidebar(false)} className={`w-6 h-6 sm:hidden ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          : 
          <Menu onClick={() => setSidebar(true)} className={`w-6 h-6 sm:hidden ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        }

        {/* Dark mode toggle button */}
        <button 
          onClick={toggleDarkMode} 
          className={`p-2 rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>
      
      <div className='flex w-full h-[calc(100vh-64px)] flex-1'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-[#F4F7FB]'}`}> 
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      <SignIn />
    </div>
  )
}

export default Layout