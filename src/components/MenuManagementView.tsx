import React, { useState, useMemo } from 'react';
import { 
  MenuSquare, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  Edit3, 
  DollarSign, 
  Leaf, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMenu } from '../hooks/useMenu';
import { MENU_CATEGORIES } from '../data/menuData';
import { MenuItem } from '../types';

export const MenuManagementView: React.FC = () => {
  const { settings } = useApp();
  const { menuItems, toggleAvailability, updatePrice } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleStartEditPrice = (item: MenuItem) => {
    setEditingItemId(item.id);
    setTempPrice(String(item.price));
  };

  const handleSavePrice = (itemId: string) => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val >= 0) {
      updatePrice(itemId, val);
    }
    setEditingItemId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Catalog & Price Controller
          </span>
          <h2 className="text-2xl font-bold font-serif text-text">
            Hilldale Menu & Availability
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Manage live pricing, 86'd out-of-stock items, and food descriptions across all 23 categories.
          </p>
        </div>

        <div className="text-xs bg-white border border-border p-3 rounded-2xl flex items-center gap-4 text-text shadow-xs">
          <div>
            <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Total Menu</span>
            <span className="text-base font-bold font-serif text-text">{menuItems.length} Dishes</span>
          </div>
          <div className="border-l border-border pl-4">
            <span className="text-secondary block text-[10px] uppercase font-bold tracking-wider">Available</span>
            <span className="text-base font-bold font-serif text-primary">
              {menuItems.filter(i => i.isAvailable).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or beverage name..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3 py-2 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto bg-surface-muted border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-hidden focus:border-primary"
          >
            <option value="all">All Categories ({menuItems.length})</option>
            {MENU_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-secondary uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Menu Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Dietary / Notes</th>
                <th className="py-3.5 px-4 text-right">Price (USD)</th>
                <th className="py-3.5 px-4 text-right">Price (LKR)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Edit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D6]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-hover transition">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-text">{item.name}</p>
                    {item.description && (
                      <p className="text-[11px] text-secondary line-clamp-1">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#424242]">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted text-secondary-dark border border-border">
                      {MENU_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {item.isVegetarian && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-light text-primary border border-border-focus">
                          (V) Vegetarian
                        </span>
                      )}
                      {item.portionInfo && (
                        <span className="text-[10px] text-secondary font-medium">
                          {item.portionInfo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {editingItemId === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-20 bg-white border border-primary rounded-lg px-2 py-0.5 text-xs text-right font-mono font-bold text-text"
                        />
                        <button
                          onClick={() => handleSavePrice(item.id)}
                          className="p-1 rounded-lg bg-primary text-white font-bold hover:bg-[#4d5541] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-text text-sm">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-secondary text-xs">
                    Rs. {Math.round(item.price * settings.usdToLkrRate).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleAvailability(item.id, !item.isAvailable)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer border ${
                        item.isAvailable
                          ? 'bg-primary-light text-primary border-border-focus hover:bg-secondary-light hover:text-accent'
                          : 'bg-secondary-light text-accent border-border hover:bg-primary-light hover:text-primary'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : '86’d (Out)'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleStartEditPrice(item)}
                      className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-muted transition cursor-pointer"
                      title="Edit Price"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
