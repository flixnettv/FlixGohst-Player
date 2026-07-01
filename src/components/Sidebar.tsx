import React from 'react';
import { Tv, Film, Clapperboard, Settings, Globe } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, trans, isAr }: { activeTab: string, setActiveTab: (tab: any) => void, trans: any, isAr: boolean }) {
  return (
    <nav className="hidden md:flex md:w-64 bg-black/45 border-r border-gray-900/40 p-4 flex flex-col justify-between shrink-0 z-10">
      <div className="space-y-2">
        <button
          onClick={() => { setActiveTab('live'); }}
          className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
            activeTab === 'live' 
              ? 'bg-blue-600/20 text-white shadow-lg' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Tv className="w-5 h-5 shrink-0" />
          <span className="hidden md:inline font-bold text-sm">{trans.liveTv}</span>
        </button>
        {/* ... add other buttons here ... */}
      </div>
    </nav>
  );
}
