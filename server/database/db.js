import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', '..', 'data', 'waste.json');

let data = {
  entries: [],
  items: [],
  nextEntryId: 1,
  nextItemId: 1
};

export function initDatabase() {
  // Ensure data directory exists
  mkdir(join(__dirname, '..', '..', 'data'), { recursive: true }).catch(() => {});

  // Load existing data if it exists
  if (existsSync(DB_PATH)) {
    try {
      const fileData = readFileSync(DB_PATH, 'utf8');
      data = JSON.parse(fileData);
      // Ensure IDs are set
      if (!data.nextEntryId) {
        data.nextEntryId = Math.max(0, ...data.entries.map(e => e.id)) + 1;
      }
      if (!data.nextItemId) {
        data.nextItemId = Math.max(0, ...data.items.map(i => i.id)) + 1;
      }
    } catch (error) {
      console.error('Error loading database:', error);
      data = { entries: [], items: [], nextEntryId: 1, nextItemId: 1 };
    }
  }

  // Save initial structure
  saveData();
}

function saveData() {
  try {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

export function logWaste(wasteData) {
  const { imagePath, items, estimatedWaste, timestamp, notes, imageHash, duplicateOfEntryId, consistencyNote } = wasteData;
  
  const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  const entryId = data.nextEntryId++;
  const entry = {
    id: entryId,
    image_path: imagePath,
    timestamp,
    total_estimated_value: totalValue,
    estimated_weight: estimatedWaste?.weight || '',
    notes: notes || '',
    image_hash: imageHash || '',
    duplicate_of_entry_id: duplicateOfEntryId || null,
    consistency_note: consistencyNote || '',
    created_at: new Date().toISOString()
  };

  data.entries.push(entry);

  const savedItems = items.map(item => {
    const itemId = data.nextItemId++;
    const savedItem = {
      id: itemId,
      waste_entry_id: entryId,
      name: item.name,
      category: item.category || 'unknown',
      estimated_amount: item.estimatedAmount || '',
      condition: item.condition || 'unknown',
      estimated_value: item.estimatedValue || 0
    };
    data.items.push(savedItem);
    return savedItem;
  });

  saveData();

  return {
    id: entryId,
    imagePath,
    timestamp,
    totalEstimatedValue: totalValue,
    items: savedItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      estimatedAmount: item.estimated_amount,
      condition: item.condition,
      estimatedValue: item.estimated_value
    }))
  };
}

export function getWasteHistory(options = {}) {
  const { limit = 50, startDate, endDate } = options;

  let entries = [...data.entries];

  // Filter by date range
  if (startDate) {
    entries = entries.filter(e => e.timestamp >= startDate);
  }

  if (endDate) {
    entries = entries.filter(e => e.timestamp <= endDate);
  }

  // Sort by timestamp descending and limit
  entries = entries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  // Get items for each entry
  return entries.map(entry => {
    const items = data.items
      .filter(item => item.waste_entry_id === entry.id)
      .map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        estimatedAmount: item.estimated_amount,
        condition: item.condition,
        estimatedValue: item.estimated_value
      }));

    return {
      ...entry,
      items
    };
  });
}

export function getWasteStats() {
  const stats = {};

  // Overall stats
  const entries = data.entries;
  const totalValue = entries.reduce((sum, e) => sum + (e.total_estimated_value || 0), 0);
  const avgValue = entries.length > 0 ? totalValue / entries.length : 0;

  stats.overall = {
    total_entries: entries.length,
    total_value: totalValue,
    avg_value: avgValue
  };

  // Top wasted items
  const itemCounts = {};
  data.items.forEach(item => {
    if (!itemCounts[item.name]) {
      itemCounts[item.name] = {
        name: item.name,
        category: item.category,
        frequency: 0,
        total_value: 0,
        values: []
      };
    }
    itemCounts[item.name].frequency++;
    itemCounts[item.name].total_value += item.estimated_value || 0;
    itemCounts[item.name].values.push(item.estimated_value || 0);
  });

  stats.topItems = Object.values(itemCounts)
    .map(item => ({
      ...item,
      avg_value: item.values.length > 0 
        ? item.values.reduce((sum, v) => sum + v, 0) / item.values.length 
        : 0
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(({ values, ...rest }) => rest);

  // Daily stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentEntries = entries.filter(e => 
    new Date(e.timestamp) >= thirtyDaysAgo
  );

  const dailyMap = {};
  recentEntries.forEach(entry => {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date,
        entries: 0,
        total_value: 0
      };
    }
    dailyMap[date].entries++;
    dailyMap[date].total_value += entry.total_estimated_value || 0;
  });

  stats.dailyStats = Object.values(dailyMap)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Category breakdown
  const categoryCounts = {};
  data.items.forEach(item => {
    const cat = item.category || 'unknown';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = {
        category: cat,
        frequency: 0,
        total_value: 0
      };
    }
    categoryCounts[cat].frequency++;
    categoryCounts[cat].total_value += item.estimated_value || 0;
  });

  stats.categoryStats = Object.values(categoryCounts)
    .sort((a, b) => b.total_value - a.total_value);

  return stats;
}

export function getSuggestions() {
  const stats = getWasteStats();
  const suggestions = [];

  // Analyze top wasted items
  if (stats.topItems && stats.topItems.length > 0) {
    const topItem = stats.topItems[0];
    if (topItem.frequency >= 5) {
      suggestions.push({
        type: 'portion_adjustment',
        priority: 'high',
        title: `Consider reducing portions for ${topItem.name}`,
        description: `${topItem.name} is being wasted frequently (${topItem.frequency} times). Consider reducing portion sizes or offering half-portion options.`,
        estimatedSavings: `$${topItem.total_value.toFixed(2)} per period`
      });
    }
  }

  // Category-based suggestions
  if (stats.categoryStats && stats.categoryStats.length > 0) {
    stats.categoryStats.forEach(cat => {
      if (cat.frequency >= 10 && cat.total_value > 50) {
        suggestions.push({
          type: 'menu_change',
          priority: 'medium',
          title: `Review menu items in ${cat.category} category`,
          description: `${cat.category} items account for $${cat.total_value.toFixed(2)} in waste. Consider menu rotation or recipe adjustments.`,
          estimatedSavings: `Up to $${(cat.total_value * 0.3).toFixed(2)} per period`
        });
      }
    });
  }

  // Daily trend suggestions
  if (stats.dailyStats && stats.dailyStats.length > 0) {
    const avgDaily = stats.dailyStats.reduce((sum, day) => sum + day.total_value, 0) / stats.dailyStats.length;
    const recentDays = stats.dailyStats.slice(0, 3);
    const recentAvg = recentDays.reduce((sum, day) => sum + day.total_value, 0) / recentDays.length;

    if (recentAvg > avgDaily * 1.2 && avgDaily > 0) {
      suggestions.push({
        type: 'trend_alert',
        priority: 'high',
        title: 'Recent increase in food waste detected',
        description: `Waste has increased ${((recentAvg / avgDaily - 1) * 100).toFixed(0)}% in recent days. Review recent menu changes or preparation methods.`,
        estimatedSavings: 'Monitor and adjust'
      });
    }
  }

  // General best practices
  suggestions.push({
    type: 'best_practice',
    priority: 'low',
    title: 'Prevent food waste best practices',
    description: 'Consider: 1) Pre-ordering systems to reduce over-preparation, 2) Flexible portion sizes, 3) Daily specials for items nearing expiration, 4) Staff training on portion control, 5) Regular inventory rotation',
    estimatedSavings: 'Long-term improvement'
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export function findEntryByImageHash(imageHash) {
  if (!imageHash) return null;
  const entries = [...data.entries]
    .filter(e => e.image_hash === imageHash)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (entries.length === 0) return null;
  const entry = entries[0];
  const items = data.items
    .filter(item => item.waste_entry_id === entry.id)
    .map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      estimatedAmount: item.estimated_amount,
      condition: item.condition,
      estimatedValue: item.estimated_value
    }));
  return { ...entry, items };
}

export function deleteEntryById(entryId) {
  const id = Number(entryId);
  const index = data.entries.findIndex(e => e.id === id);
  if (index === -1) {
    return { success: false, message: `Entry #${id} not found` };
  }
  // Remove items for this entry
  data.items = data.items.filter(item => item.waste_entry_id !== id);
  // Remove the entry itself
  data.entries.splice(index, 1);
  saveData();
  return { success: true, message: `Entry #${id} deleted` };
}

export function clearAllWasteData() {
  data = {
    entries: [],
    items: [],
    nextEntryId: 1,
    nextItemId: 1
  };
  saveData();
  return { success: true, message: 'All waste data cleared' };
}