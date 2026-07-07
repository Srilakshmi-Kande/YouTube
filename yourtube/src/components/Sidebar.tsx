import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Clock, Compass, Crown, Download, History, Home, PlaySquare, ThumbsUp, User, X } from 'lucide-react';
import ChannelDialog from './ChannelDialog';
import { useUser } from '@/lib/AuthContext';
import { useLayout } from '@/lib/LayoutContext';
import { useRouter } from 'next/router';

function Sidebar() {
    const { user } = useUser()
    const { sidebarOpen, closeSidebar } = useLayout()
    const [isdialogueopen, setisdialogueopen] = useState(false);
    const router = useRouter();

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            closeSidebar();
        }
    };

    const navLink = (href: string, children: React.ReactNode) => (
        <Link href={href} onClick={handleNavClick}>
            {children}
        </Link>
    );

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 max-w-[85vw] bg-white border-r
          min-h-[calc(100dvh-3.5rem)] lg:min-h-screen
          p-2 overflow-y-auto
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between lg:hidden mb-2 px-1">
          <span className="text-sm font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={closeSidebar} aria-label="Close menu">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="space-y-1">
          {navLink("/", (
            <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/" ? "bg-gray-100" : ""}`}>
              <Home className="w-5 h-5 mr-3 shrink-0" />
              Home
            </Button>
          ))}
          {navLink("/explore", (
            <Button variant="ghost" className="w-full justify-start">
              <Compass className="w-5 h-5 mr-3 shrink-0" />
              Explore
            </Button>
          ))}
          {navLink("/premium", (
            <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/premium" ? "bg-gray-100" : ""}`}>
              <Crown className="w-5 h-5 mr-3 shrink-0 text-yellow-600" />
              Premium
            </Button>
          ))}
          {navLink("/subscriptions", (
            <Button variant="ghost" className="w-full justify-start">
              <PlaySquare className="w-5 h-5 mr-3 shrink-0" />
              Subscriptions
            </Button>
          ))}

          {user && (
            <div className="border-t pt-2 mt-2">
              {navLink("/history", (
                <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/history" ? "bg-gray-100" : ""}`}>
                  <History className="w-5 h-5 mr-3 shrink-0" />
                  History
                </Button>
              ))}
              {navLink("/liked", (
                <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/liked" ? "bg-gray-100" : ""}`}>
                  <ThumbsUp className="w-5 h-5 mr-3 shrink-0" />
                  Liked videos
                </Button>
              ))}
              {navLink("/watch-later", (
                <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/watch-later" ? "bg-gray-100" : ""}`}>
                  <Clock className="w-5 h-5 mr-3 shrink-0" />
                  Watch later
                </Button>
              ))}
              {navLink("/downloads", (
                <Button variant="ghost" className={`w-full justify-start ${router.pathname === "/downloads" ? "bg-gray-100" : ""}`}>
                  <Download className="w-5 h-5 mr-3 shrink-0" />
                  Downloads
                </Button>
              ))}
              {user?.channelname ? (
                navLink(`/channel/${user._id}`, (
                  <Button variant="ghost" className={`w-full justify-start ${router.pathname.startsWith("/channel") ? "bg-gray-100" : ""}`}>
                    <User className="w-5 h-5 mr-3 shrink-0" />
                    Your channel
                  </Button>
                ))
              ) : (
                <div className='px-2 py-1.5'>
                  <Button variant="secondary" size="sm" className='w-full' onClick={() => {
                    setisdialogueopen(true);
                    closeSidebar();
                  }}>
                    Create a channel
                  </Button>
                </div>
              )}
            </div>
          )}
        </nav>
        <ChannelDialog isopen={isdialogueopen} onclose={() => setisdialogueopen(false)} mode="create" />
      </aside>
    </>
  )
}

export default Sidebar
