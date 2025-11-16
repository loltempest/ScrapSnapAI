import { useState, useEffect } from 'react';
import { Camera, BarChart3, TrendingDown } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-6">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Waste Reduction</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-500 to-lime-500 bg-clip-text text-transparent">
              ScrapSnap AI
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Transform food waste into actionable insights. Snap a photo, get instant AI analysis,
              and reduce waste with data‑driven recommendations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center rounded-lg bg-emerald-600 text-white px-6 py-3 text-base font-medium shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Analyzing
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="inline-flex items-center rounded-lg border border-emerald-300 text-emerald-700 px-6 py-3 text-base hover:bg-emerald-50 transition-colors"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </button>
            </div>
          </div>
        </div>
        {/* Decorative gradient circles */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 bg-lime-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
      </section>

      <nav className="bg-white/60 backdrop-blur border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'upload', label: '📸 Upload', icon: '📸' },
              { id: 'history', label: '📋 History', icon: '📋' },
              { id: 'analytics', label: '📊 Analytics', icon: '📊' },
              { id: 'suggestions', label: '💡 Suggestions', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-emerald-700 hover:border-emerald-300'
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