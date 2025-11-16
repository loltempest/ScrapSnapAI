import { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import WasteHistory from './components/WasteHistory';
import Analytics from './components/Analytics';
import Suggestions from './components/Suggestions';
import { getWasteStats, getSuggestions } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      const [statsData, suggestionsData] = await Promise.all([
        getWasteStats(),
        getSuggestions()
      ]);
      setStats(statsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🍽️ ScrapSnap AI
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered food waste tracking and reduction for restaurants
          </p>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'upload', label: '📸 Upload Waste', icon: '📸' },
              { id: 'history', label: '📋 History', icon: '📋' },
              { id: 'analytics', label: '📊 Analytics', icon: '📊' },
              { id: 'suggestions', label: '💡 Suggestions', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <ImageUpload onSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'history' && (
          <WasteHistory refreshKey={refreshKey} />
        )}
        {activeTab === 'analytics' && (
          <Analytics stats={stats} />
        )}
        {activeTab === 'suggestions' && (
          <Suggestions suggestions={suggestions} />
        )}
      </main>
    </div>
  );
}

export default App;