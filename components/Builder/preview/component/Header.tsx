import React, { useState, useEffect } from 'react';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Schedule', icon: 'calendar_today', id: 'schedule-section' },
    { name: 'Live', icon: 'live_tv', id: 'live-section' },
    { name: 'Standings', icon: 'leaderboard', id: 'leaderboard-section' },
    { name: 'Stats', icon: 'stats-section', id: 'stats-section' }, // ID updated to match widget
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-sm transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                alt="B5Tools Logo"
                className="h-14 md:h-16 w-auto object-contain animate-float"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJQmut-RSi8NSZ870i01UMW18Gw-11AOb7WjaxzOY9EcarduLCI7vAYx0aTIUvoelNw3g3iUvhGWB7u3uQgmbTrd8xdKXKf6fcQ5Dt_-yTvi_CAPaIty6aW69Y0tURRSx9wBFPzgk3hmkwXimAF-H9a1eTWT9lX-X61Jne_Pe7wyCVbwgbIrjdDa8bEv-D3x7TW7A3DoOWkxPD3y25Me-2ISWq1EEI81emAb8S8tcFp6LAQngTZWi3eZCUY8z8N40XW3wlBEmUEWA"
              />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-display font-bold text-xl md:text-2xl tracking-wider text-gray-900 dark:text-white uppercase">
                <span className="text-primary">B5</span>TOOLS
              </h1>
              <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                Tournament Live View
              </p>
            </div>
          </div>

          {/* Desktop Navigation (Visible on Large screens only) */}
          <div className="hidden lg:flex items-center space-x-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/10 backdrop-blur-md">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:text-primary dark:hover:text-primary transition-all group"
              >
                <span className="material-icons-round text-lg mr-1.5 text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>

          {/* Controls Section */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="hidden lg:flex items-center space-x-2 bg-gray-100 dark:bg-card-dark px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">LIVE</span>
            </div>

            <div className="text-right hidden xl:block">
              <div className="text-sm font-bold text-gray-900 dark:text-white" suppressHydrationWarning>{currentTime}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Oct 24, 2023</div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary dark:hover:bg-white/10 transition-all focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              <span className="material-icons-round text-2xl">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Mobile Menu Button (Hamburger) - Kept for secondary actions */}
            <button
              className="lg:hidden p-2 rounded-full text-gray-500 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-icons-round text-2xl">menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Bar (Below Header) */}
      <div className="lg:hidden flex items-center justify-around px-2 pb-2 pt-1 border-t border-gray-200/50 dark:border-gray-700/30 overflow-x-auto hide-scroll gap-1 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => scrollToSection(item.id)}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors focus:outline-none"
          >
            <span className="material-icons-round text-2xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Header;