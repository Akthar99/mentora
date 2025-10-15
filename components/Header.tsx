'use client';

import { Search, Bell, User } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
          </Link>

          <nav className="flex items-center space-x-8">
            <Link href="/" className="text-gray-900 font-medium hover:text-gray-600 transition">
              Home
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
