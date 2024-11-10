'use client';

import { useState, useEffect, useRef } from 'react';
import { database } from '@/firebase/config';
import { ref, get, DataSnapshot } from 'firebase/database';
import { Server, Map, Building, Users, Settings, Phone, FileText, PieChart, Search, Menu, X, Loader2, ChevronRight } from 'lucide-react';
import DatabaseView from '@/components/DatabaseView';
import MapView from '@/components/MapView';
import YazamView from '@/components/YazamView';
import StatsDashboard from '@/components/StatsDashbord';
import OwnersView from '@/components/OwnersView';
import StatsView from '@/components/StatsView';
import SearchView from '@/components/SearchView';
import ContactForm from '@/components/ContactForm';
import Documentation from '@/components/Documentation';
import { Filter } from 'lucide-react';
import FiltersView from '@/components/FiltersView';
import SettingsDialog from '@/components/SettingsDialog';



interface Vehicle {
  רישוי: string;
  סוג?: string;
  יצרן?: string;
  [key: string]: any;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'main' | 'database' | 'map' |'owners'|'search'|'stats'|'filters'| 'yazam'>('main');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickResults, setQuickResults] = useState<Vehicle[]>([]);
  const [allData, setAllData] = useState<Vehicle[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, '/data/data');
        const snapshot: DataSnapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val());
          setAllData(data as Vehicle[]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      console.log('Searching for:', searchTerm);
      setIsLoading(true);
      const results = allData
        .filter(item => {
          const licenseNumber = item.רישוי?.toString() || '';
          return licenseNumber.includes(searchTerm);
        })
        .slice(0, 5);
      setQuickResults(results);
      setShowResults(true);
      setIsLoading(false);
    } else {
      setQuickResults([]);
      setShowResults(false);
    }
  }, [searchTerm, allData]);
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setCurrentView('search');
      setShowResults(false);
    }
  };

  const NavBar = () => (
    <div className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div 
            onClick={() => setCurrentView('main')}
            className="cursor-pointer flex items-center gap-2 text-gray-800 hover:text-blue-600 transition-colors"
          >
            <span className="font-bold text-xl">צהל - בלמ"ס</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setIsDocumentationOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
            >
              <FileText className="h-5 w-5" />
              <span>תיעוד</span>
            </button>

            <button
              onClick={() => setIsContactFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
            >
              <Phone className="h-5 w-5" />
              <span>יצירת קשר</span>
            </button>

            <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
          >
            <Settings className="h-5 w-5" />
            <span>הגדרות</span>
          </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsDocumentationOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
              >
                <FileText className="h-5 w-5" />
                <span>תיעוד</span>
              </button>

              <button
                onClick={() => {
                  setIsContactFormOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
              >
                <Phone className="h-5 w-5" />
                <span>יצירת קשר</span>
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-all"
              >
                <Settings className="h-5 w-5" />
                <span>הגדרות</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const QuickSearchResults = () => (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-50">
      {quickResults.map((result, index) => (
        <div
          key={index}
          className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
          onClick={() => {
            setSearchTerm(result.רישוי);
            setCurrentView('search');
            setShowResults(false);
          }}
        >
          <div>
            <div className="font-medium text-lg">{result.רישוי}</div>
            <div className="text-sm text-gray-500 mt-1">
              {result.סוג || 'לא צוין סוג'} • {result.יצרן || 'לא צוין יצרן'}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      ))}
      {quickResults.length === 0 && searchTerm && (
        <div className="p-4 text-gray-500 text-center">
          לא נמצאו תוצאות עבור "{searchTerm}"
        </div>
      )}
      {quickResults.length > 0 && (
        <button
          onClick={() => {
            setCurrentView('search');
            setShowResults(false);
          }}
          className="w-full p-4 text-center text-blue-600 hover:bg-blue-50 font-medium transition-colors"
        >
          צפה בכל התוצאות
        </button>
      )}
    </div>
  );

  if (currentView !== 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <NavBar />
        <div className="p-4 md:p-6">
          <button 
            onClick={() => setCurrentView('main')}
            className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← חזור למסך הראשי
          </button>
          {currentView === 'database' && <DatabaseView />}
          {currentView === 'map' && <MapView />}
          {currentView === 'yazam' && <YazamView />}
          {currentView === 'owners' && <OwnersView />}
          {currentView === 'stats' && <StatsView />}
          {currentView === 'search' && <SearchView initialSearchTerm={searchTerm} />}
          {currentView === 'filters' && <FiltersView />}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavBar />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      <ContactForm 
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />
      <Documentation
        isOpen={isDocumentationOpen}
        onClose={() => setIsDocumentationOpen(false)}
      />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-8">
            מערכת ניהול כלי צמ"ה
          </h1>
          
          <div className="max-w-2xl mx-auto mb-8 relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder="הקלד מספר רישוי..."
                  className="w-full px-4 py-4 pr-12 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg"
                  dir="rtl"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
            </form>
            {showResults && <QuickSearchResults />}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
          <Card
            icon={<Server className="h-7 w-7 text-green-600" />}
            title="בסיס נתונים"
            description="ניהול מאובטח של נתונים"
            onClick={() => setCurrentView('database')}
            hoverColor="green"
          />
          
          <Card
            icon={<Map className="h-7 w-7 text-blue-600" />}
            title="מפה"
            description="סינון על מפה"
            onClick={() => setCurrentView('map')}
            hoverColor="blue"
          />
          
          <Card
            icon={<Building className="h-7 w-7 text-purple-600" />}
            title="יצ״מ - מגוייסים"
            description="יחידות צמ״ה לפי אזורים"
            onClick={() => setCurrentView('yazam')}
            hoverColor="purple"
          />
          
          <Card
            icon={<Users className="h-7 w-7 text-yellow-600" />}
            title="בעלים"
            description="ניהול בעלי ציוד"
            onClick={() => setCurrentView('owners')}
            hoverColor="yellow"
          />
          
          <Card
            icon={<PieChart className="h-7 w-7 text-red-600" />}
            title="סטטיסטיקה"
            description="ניתוח נתונים וגרפים"
            onClick={() => setCurrentView('stats')}
            hoverColor="red"
          />
          
          <Card
          icon={<Filter className="h-7 w-7 text-indigo-600" />}
          title="מסננים"
          description="סינון מתקדם של נתונים"
          onClick={() => setCurrentView('filters')}
          hoverColor="indigo"
        />
          
        </div>
        
        <div className="mt-8 md:mt-16">
          <StatsDashboard />
        </div>
      </main>
    </div>
  );
}

const Card = ({ icon, title, description, onClick, hoverColor }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  hoverColor: string;
}) => (
  <div 
    onClick={onClick}
    className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border border-gray-100 hover:border-${hoverColor}-500 cursor-pointer`}
  >
    <div className="text-right">
      <div className="flex justify-between items-center mb-4">
        <div className={`p-3 bg-${hoverColor}-50 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed text-sm md:text-base">
        {description}
      </p>
    </div>
  </div>
);