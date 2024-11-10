'use client';

import { useState } from 'react';
import { Book, Newspaper, ArrowLeft, ChevronDown } from 'lucide-react';

interface DocsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Documentation({ isOpen, onClose }: DocsProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'news'>('docs');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const documentationSections = [
    {
      id: 'intro',
      title: 'מבוא',
      content: 'מערכת זו נבנתה לאגד את נתוני הצמה והמלגזות, לאתר לסנן ולעקוב אחרי מיקומן ומצבן.'
    },
    {
      id: 'search',
      title: 'חיפוש',
      content: 'ניתן לחפש לפי מספר רישוי, ולקבל את כל המידע הרלוונטי על הכלי המבוקש.'
    },
    {
      id: 'map',
      title: 'מפה',
      content: 'המפה מציגה את מיקום כל הכלים על גבי מפה אינטראקטיבית.'
    },
    {
      id: 'stats',
      title: 'סטטיסטיקות',
      content: 'הצגת נתונים סטטיסטיים על הכלים, כולל גרפים ותרשימים.'
    }
  ];

  const newsItems = [
    {
      date: '10.11.2024',
      title: 'עדכון מערכת חדש',
      content: 'שודרגה יכולת החיפוש במערכת. כעת ניתן לחפש במהירות ובקלות רבה יותר.',
      tag: 'חדש'
    },
    {
      date: '09.11.2024',
      title: 'עדכון נתונים',
      content: 'עודכנו נתוני המערכת עם המידע העדכני ביותר מהשטח.',
      tag: 'עדכון'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="min-h-screen bg-gray-50 md:mr-auto md:w-2/3 lg:w-1/2 shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'docs' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Book className="h-5 w-5" />
                  <span>תיעוד</span>
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'news' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Newspaper className="h-5 w-5" />
                  <span>חדשות</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto p-4 md:p-6">
          {activeTab === 'docs' ? (
            <div className="space-y-6" dir="rtl">
              <h1 className="text-3xl font-bold text-gray-900">תיעוד המערכת</h1>
              <p className="text-gray-600 text-lg">
                ברוכים הבאים למערכת ניהול כלי צמ"ה. כאן תוכלו למצוא את כל המידע הנחוץ לשימוש במערכת.
              </p>

              <div className="space-y-4 mt-8">
                {documentationSections.map((section) => (
                  <div key={section.id} className="bg-white rounded-lg shadow-sm">
                    <button
                      onClick={() => setExpandedSection(
                        expandedSection === section.id ? null : section.id
                      )}
                      className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedSection === section.id ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSection === section.id && (
                      <div className="p-4 pt-0 border-t">
                        <p className="text-gray-600">{section.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6" dir="rtl">
              <h1 className="text-3xl font-bold text-gray-900">חדשות ועדכונים</h1>
              
              <div className="space-y-4">
                {newsItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-sm text-gray-500">{item.date}</span>
                          <h3 className="text-xl font-semibold text-gray-800 mt-1">
                            {item.title}
                          </h3>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-gray-600">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}