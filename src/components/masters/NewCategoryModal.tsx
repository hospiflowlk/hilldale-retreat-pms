import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Tag, Layers, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterCategory, MasterCategoryType } from '../../types';
import { useCategories } from '../../hooks/useMasters';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: MasterCategory | null;
  initialType?: MasterCategoryType;
}

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  initialType = 'EXPENSE'
}) => {
  const { data: masterCategories = [] } = useCategories.useGetAll();
  const createCategoryMut = useCategories.useCreate();
  const updateCategoryMut = useCategories.useUpdate();

  const [name, setName] = useState('');
  const [type, setType] = useState<MasterCategoryType>(initialType);
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#5B6547');
  const [error, setError] = useState<string | null>(null);

  // Root categories only (cannot select a child category as parent, enforcing 1-level hierarchy)
  const rootCategories = masterCategories.filter(c => !c.parentId && c.id !== categoryToEdit?.id && c.type === type);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setParentId(categoryToEdit.parentId || '');
      setDescription(categoryToEdit.description || '');
      setColor(categoryToEdit.color || '#5B6547');
    } else {
      setName('');
      setType(initialType);
      setParentId('');
      setDescription('');
      setColor(initialType === 'INCOME' ? '#5B6547' : '#8C735D');
    }
    setError(null);
  }, [categoryToEdit, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name.');
      return;
    }

    if (categoryToEdit) {
      updateCategoryMut.mutate({
        id: categoryToEdit.id,
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        description: description.trim() || undefined,
        color
      });
    } else {
      createCategoryMut.mutate({
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        description: description.trim() || undefined,
        color,
        isActive: true
      });
    }
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-text">
                {categoryToEdit ? 'Edit Category' : 'Create New Category'}
              </h3>
              <p className="text-xs text-secondary">
                {categoryToEdit ? 'Update category classification and hierarchy' : 'Add an income or expense chart of accounts category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-text hover:bg-surface-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Category Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('INCOME'); setParentId(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'INCOME'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-secondary hover:text-text border-border'
                }`}
              >
                <span>📈 Income / Revenue</span>
              </button>
              <button
                type="button"
                onClick={() => { setType('EXPENSE'); setParentId(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'EXPENSE'
                    ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                    : 'bg-white text-secondary hover:text-text border-border'
                }`}
              >
                <span>📉 Expense / Cost</span>
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Poultry & Meats, Wine & Spirits, Room Tariff"
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Parent Category Selector (1-Level Nesting Enforced) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-text uppercase tracking-wider">
                Parent Group (1-Level Nesting)
              </label>
              <span className="text-[10px] text-secondary">Optional</span>
            </div>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            >
              <option value="">None (Top-Level Root Group)</option>
              {rootCategories.map((root) => (
                <option key={root.id} value={root.id}>
                  📁 {root.name} (Root Group)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-secondary mt-1">
              {parentId 
                ? 'This category will nest under the selected parent root group for consolidated P&L reporting.' 
                : 'This category will act as a primary top-level parent group.'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Description & Reporting Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of items or transactions that belong here..."
              className="w-full bg-surface-muted border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-hidden focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Color Accent */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Badge Color Accent
            </label>
            <div className="flex items-center gap-2">
              {['#5B6547', '#8C735D', '#C08081', '#4B5563', '#2563EB', '#0D9488', '#D97706', '#7C3AED'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition cursor-pointer flex items-center justify-center border ${
                    color === c ? 'ring-2 ring-primary ring-offset-1 border-transparent' : 'border-border'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-text hover:bg-surface-muted border border-border transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
