import { useEffect, useState } from 'react';
import { getWasteHistory } from '../services/api';

function Suggestions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [computedSuggestions, setComputedSuggestions] = useState([]);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        setLoading(true);
        setError(null);
        const entries = await getWasteHistory({ limit: 3 });
        setRecentEntries(entries || []);

        if ((entries || []).length >= 3) {
          setComputedSuggestions(generateSuggestionsFromEntries(entries));
        } else {
          setComputedSuggestions([]);
        }
      } catch (e) {
        setError('Failed to load recent entries for suggestions');
      } finally {
        setLoading(false);
      }
    };
    loadRecent();
  }, []);

  const generateSuggestionsFromEntries = (entries) => {
    const suggestions = [];

    // Aggregate item counts and values across last 3 entries
    const itemMap = new Map();
    const conditions = new Map(); // itemName -> Set of conditions seen
    let totalRecentValue = 0;

    entries.forEach((entry) => {
      totalRecentValue += parseFloat(entry.total_estimated_value || 0) || 0;
      (entry.items || []).forEach((item) => {
        const name = (item.name || 'Unknown item').toLowerCase();
        const prev = itemMap.get(name) || { name: item.name || 'Unknown item', count: 0, totalValue: 0 };
        prev.count += 1;
        prev.totalValue += parseFloat(item.estimatedValue || 0) || 0;
        itemMap.set(name, prev);

        const condSet = conditions.get(name) || new Set();
        if (item.condition) condSet.add(String(item.condition).toLowerCase());
        conditions.set(name, condSet);
      });
    });

    // Portion adjustment suggestions for items appearing multiple times
    const repeated = Array.from(itemMap.values()).filter((i) => i.count >= 2);
    repeated.sort((a, b) => b.totalValue - a.totalValue);
    repeated.slice(0, 3).forEach((it) => {
      const priority = it.count === 3 || it.totalValue >= 10 ? 'high' : 'medium';
      suggestions.push({
        type: 'portion_adjustment',
        priority,
        title: `Reduce portions or adjust prep for ${it.name}`,
        description: `${it.name} appeared in ${it.count} of your last 3 entries (≈ $${it.totalValue.toFixed(2)} wasted). Consider smaller default portions, offering half sizes, or preparing fewer batches.`,
        estimatedSavings: it.totalValue > 0 ? `Up to $${(it.totalValue * 0.3).toFixed(2)} per week` : undefined
      });
    });

    // Storage/rotation suggestions if spoilage observed
    const spoiledItems = Array.from(conditions.entries())
      .filter(([_, set]) => set.has('spoiled') || set.has('expired') || set.has('stale'));
    spoiledItems.slice(0, 2).forEach(([name]) => {
      suggestions.push({
        type: 'best_practice',
        priority: 'medium',
        title: `Improve storage and rotation for ${name}`,
        description: `Recent entries show spoilage or staleness for ${name}. Tighten FIFO rotation, cool-down procedures, and sealed storage to extend shelf life and prevent discard.`,
        estimatedSavings: undefined
      });
    });

    // If none found, add a simple actionable summary based on highest value item
    if (suggestions.length === 0) {
      const top = Array.from(itemMap.values()).sort((a, b) => b.totalValue - a.totalValue)[0];
      if (top) {
        suggestions.push({
          type: 'trend_alert',
          priority: 'low',
          title: `Focus on ${top.name} waste first`,
          description: `${top.name} contributed the most value to waste across your last 3 entries (≈ $${top.totalValue.toFixed(2)}). Review portioning, prep timing, and menu fit.`,
          estimatedSavings: top.totalValue > 0 ? `Save $${(top.totalValue * 0.25).toFixed(2)} by small adjustments` : undefined
        });
      }
    }

    // Always include a best-practice nudge if recent waste has non-trivial value
    if (totalRecentValue >= 5) {
      suggestions.push({
        type: 'best_practice',
        priority: 'low',
        title: 'Quick wins to reduce immediate waste',
        description: '1) Offer smaller default portions with add-on sides, 2) Pre-portion popular sides to reduce over-scooping, 3) Label prep times to tighten hold limits.',
        estimatedSavings: `Target $${(totalRecentValue * 0.2).toFixed(2)} reduction next 3 entries`
      });
    }

    return suggestions;
  };

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-4xl mb-2">🔄</div>
        <p className="text-gray-600">Loading suggestions...</p>
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

  if (recentEntries.length < 3) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            AI Suggestions
          </h2>
          <div className="text-sm text-gray-600">
            0 suggestions
          </div>
        </div>

        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            More data needed
          </h3>
          <p className="text-gray-600">
            Add at least 3 waste entries to generate tailored, trend-based suggestions.
          </p>
        </div>

        <div id="suggestions-section" className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-green-900 mb-2">
            💚 How These Suggestions Work
          </h3>
          <p className="text-sm text-green-800">
            Once you have 3 or more entries, we analyze the most recent ones to surface specific patterns (repeat items, spoilage, and high-value waste) and recommend targeted actions.
          </p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'portion_adjustment':
        return '🍽️';
      case 'menu_change':
        return '📝';
      case 'trend_alert':
        return '⚠️';
      case 'best_practice':
        return '💡';
      default:
        return '📌';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          AI Suggestions
        </h2>
        <div className="text-sm text-gray-600">
          {computedSuggestions.length} suggestion{computedSuggestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {computedSuggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              suggestion.priority === 'high' ? 'border-red-500' :
              suggestion.priority === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getTypeIcon(suggestion.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {suggestion.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}
                  >
                    {suggestion.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">
              {suggestion.description}
            </p>

            {suggestion.estimatedSavings && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">Estimated Savings:</span>
                <span className="text-green-600 font-medium">
                  {suggestion.estimatedSavings}
                </span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Type:</span> {suggestion.type.replace('_', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div  id="suggestions-section"
            className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-green-900 mb-2">
          💚 How These Suggestions Work
        </h3>
        <p className="text-sm text-green-800">
          We analyze your last three entries to identify repeat items, spoilage, and high-value waste, then recommend focused actions (portioning, storage, or menu fit). Review and iterate regularly to reduce waste and save money.
        </p>
      </div>
    </div>
  );
}

export default Suggestions;






