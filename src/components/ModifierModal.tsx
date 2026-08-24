import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Flame, 
  Utensils, 
  AlertCircle, 
  Plus, 
  Minus, 
  FileText, 
  DollarSign, 
  Sparkles,
  Tag,
  Leaf
} from 'lucide-react';
import { MenuItem } from '../types';
import { GRILLED_SIDES_OPTIONS, MENU_CATEGORIES } from '../data/menuData';
import { useApp } from '../context/AppContext';

interface ModifierModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedSides: string[], notes: string, quantity: number) => void;
  initialQuantity?: number;
  initialNotes?: string;
  initialSides?: string[];
}

// Quick kitchen instruction presets for 1-click tagging
const QUICK_NOTE_CHIPS = [
  '🌶️ Less Spicy',
  '🔥 Extra Spicy',
  '🧅 No Onions',
  '🧄 No Garlic',
  '🥛 Dairy Free',
  '🌾 Gluten Free',
  '🧂 Less Salt',
  '🧊 Less Ice',
  '🍽️ Serve as Starter',
  '📦 Pack To-Go / Takeaway',
  '🥩 Well Done',
  '🥗 Dressing on Side'
];

export const ModifierModal: React.FC<ModifierModalProps> = ({ 
  item, 
  onClose, 
  onConfirm,
  initialQuantity = 1,
  initialNotes = '',
  initialSides = []
}) => {
  const { settings } = useApp();

  if (!item) return null;

  const requiresSides = item.requiresSides || false;
  const maxSides = item.maxSides || 2;
  const availableSides = item.availableSides || GRILLED_SIDES_OPTIONS;

  const [quantity, setQuantity] = useState<number>(initialQuantity > 0 ? initialQuantity : 1);
  const [selectedSides, setSelectedSides] = useState<string[]>(initialSides);
  const [specialNotes, setSpecialNotes] = useState<string>(initialNotes);
  const [spicePreference, setSpicePreference] = useState<string>('Standard');

  const categoryName = MENU_CATEGORIES.find(c => c.id === item.category)?.name || item.category;

  const toggleSide = (side: string) => {
    if (selectedSides.includes(side)) {
      setSelectedSides(prev => prev.filter(s => s !== side));
    } else {
      if (selectedSides.length < maxSides) {
        setSelectedSides(prev => [...prev, side]);
      } else {
        // Replace first if already at max
        setSelectedSides(prev => [prev[1] || prev[0], side]);
      }
    }
  };

  const handleAddQuickNote = (chipText: string) => {
    // Strip emoji for clean notes text
    const cleanText = chipText.replace(/^[^\w\s]+/, '').trim();
    if (specialNotes.includes(cleanText)) {
      // Remove if already present
      setSpecialNotes(prev => prev.replace(cleanText, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
    } else {
      setSpecialNotes(prev => prev ? `${prev}, ${cleanText}` : cleanText);
    }
  };

  const handleQuantityChange = (val: number) => {
    const safeVal = Math.max(1, Math.min(99, val));
    setQuantity(safeVal);
  };

  const handleConfirm = () => {
    let finalNote = specialNotes.trim();
    if (spicePreference !== 'Standard') {
      finalNote = finalNote ? `${spicePreference} spice. ${finalNote}` : `${spicePreference} spice`;
    }
    onConfirm(item, selectedSides, finalNote, quantity);
    onClose();
  };

  const isValid = !requiresSides || selectedSides.length === maxSides;
  const totalUSD = item.price * quantity;
  const totalLKR = Math.round(totalUSD * settings.usdToLkrRate);

  return (
    <div className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-text animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between bg-surface-muted">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-light text-secondary border border-border">
                {categoryName}
              </span>
              {item.isVegetarian && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary border border-border-focus flex items-center gap-1">
                  <Leaf className="w-3 h-3" />
                  <span>Vegetarian</span>
                </span>
              )}
              {item.portionInfo && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-secondary border border-border">
                  {item.portionInfo}
                </span>
              )}
            </div>

            {/* Selected Item's Name */}
            <h3 className="text-xl font-bold text-text font-serif leading-tight pt-0.5">
              {item.name}
            </h3>

            {/* Unit Price */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-sm font-bold text-primary font-mono">
                ${item.price.toFixed(2)} USD
              </span>
              <span className="text-xs text-secondary font-mono">
                (≈ Rs. {Math.round(item.price * settings.usdToLkrRate).toLocaleString()} LKR each)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-secondary hover:text-text hover:bg-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {item.description && (
            <p className="text-xs text-secondary-dark leading-relaxed bg-surface-hover p-3 rounded-xl border border-border">
              {item.description}
            </p>
          )}

          {/* Quantity Selection Section */}
          <div className="space-y-2.5 bg-surface-muted/70 p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary block">
                Select Quantity
              </label>
              <span className="text-xs font-mono font-bold text-primary">
                Total: ${totalUSD.toFixed(2)} USD
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Stepper Controls */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-border shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-12 text-center text-base font-mono font-bold text-text focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-surface-muted transition cursor-pointer font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Quantity Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {[1, 2, 3, 4, 5, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuantityChange(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      quantity === q
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-secondary-dark border border-border hover:bg-surface-hover'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Item Specific Note Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Special Instructions & Item Note</span>
              </label>
              <span className="text-[11px] text-secondary">Sent to Kitchen Order Ticket (KOT)</span>
            </div>

            <textarea
              rows={2}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Less spicy, dressing on side, no onions, allergies, well done..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-xs text-text placeholder-[#8C735D] focus:outline-hidden focus:border-primary focus:bg-white transition"
            />

            {/* Quick Note Suggestions Chips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                Quick Add Preferences:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTE_CHIPS.map((chip, idx) => {
                  const clean = chip.replace(/^[^\w\s]+/, '').trim();
                  const isApplied = specialNotes.includes(clean);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddQuickNote(chip)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        isApplied
                          ? 'bg-primary-light border-primary text-primary font-semibold'
                          : 'bg-white border-border text-secondary-dark hover:bg-surface-hover'
                      }`}
                    >
                      <span>{chip}</span>
                      {isApplied && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side Choices if required */}
          {requiresSides && (
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-primary" />
                  <span>Select {maxSides} Side Dishes</span> <span className="text-primary">*</span>
                </label>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  selectedSides.length === maxSides 
                    ? 'bg-primary-light text-primary' 
                    : 'bg-secondary-light text-secondary'
                }`}>
                  {selectedSides.length} of {maxSides} selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {availableSides.map((side) => {
                  const isSelected = selectedSides.includes(side);
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => toggleSide(side)}
                      className={`p-3 rounded-xl text-left text-xs font-semibold border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary-light/60 border-primary text-primary'
                          : 'bg-surface-muted border-border text-[#424242] hover:bg-white'
                      }`}
                    >
                      <span>{side}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-secondary/40 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSides.length < maxSides && (
                <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-secondary" />
                  Please select {maxSides - selectedSides.length} more side dish.
                </p>
              )}
            </div>
          )}

          {/* Optional Spice Level Preference for Savory items */}
          {['soup', 'grilled', 'devilled', 'pasta', 'rice', 'noodles', 'sri_lankan', 'kottu'].includes(item.category) && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-secondary" />
                <span>Spice Preference Level</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Mild', 'Standard', 'Medium Spicy', 'Extra Hot'].map((spice) => (
                  <button
                    key={spice}
                    type="button"
                    onClick={() => setSpicePreference(spice)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition cursor-pointer ${
                      spicePreference === spice
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-surface-muted border-border text-secondary-dark hover:bg-white'
                    }`}
                  >
                    {spice}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Calculated Total */}
        <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-secondary hover:text-text rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isValid}
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm ${
              isValid
                ? 'bg-primary hover:bg-[#4d5541] text-white'
                : 'bg-border text-secondary cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              Add {quantity} {quantity === 1 ? 'Item' : 'Items'} to Order • ${totalUSD.toFixed(2)} (Rs. {totalLKR.toLocaleString()})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
