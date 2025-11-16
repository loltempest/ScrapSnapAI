import { useState, useEffect } from 'react';
import { getWasteHistory, clearWasteHistory } from '../services/api';
import { format } from 'date-fns';

function WasteHistory({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [refreshKey]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getWasteHistory({ limit: 50 });
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Failed to load waste history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      await clearWasteHistory();
      setHistory([]);
      setShowConfirm(false);
      setCleared(true);
      setError(null);
    } catch (err) {
      setError('Failed to clear waste history');
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Loading waste history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        {cleared && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="font-semibold mb-1">✅ History Cleared Successfully</div>
            <div className="text-sm">Refresh site to see changes</div>
          </div>
        )}
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No waste entries yet
          </h3>
          <p className="text-gray-600">
            Start tracking food waste by uploading your first photo!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Waste History
        </h2>
        {history.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Clear History
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Clear All History?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete all waste entries and cannot be undone. Are you sure?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cleared && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="font-semibold mb-1">✅ History Cleared Successfully</div>
          <div className="text-sm">Refresh site to see changes</div>
        </div>
      )}
      
      <div className="grid gap-4">
        {history.map(entry => (
          <div
            key={entry.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <img
                  src={`http://localhost:3001${entry.image_path}`}
                  alt="Waste entry"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(new Date(entry.timestamp), 'PPp')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Entry #{entry.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">
                      ${parseFloat(entry.total_estimated_value || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Estimated Value</div>
                  </div>
                </div>

                {entry.items && entry.items.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm text-gray-700">Items Wasted:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          {item.name}
                          {item.estimatedValue && (
                            <span className="ml-1">(${parseFloat(item.estimatedValue).toFixed(2)})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.estimated_weight && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Weight:</strong> {entry.estimated_weight}
                  </div>
                )}

                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {entry.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WasteHistory;






