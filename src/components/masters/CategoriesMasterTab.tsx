import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FolderTree, 
  Edit3, 
  Trash2, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  CornerDownRight, 
  Folder, 
  ChevronRight,
  Sparkles,
  Download,
  Upload,
  MoreVertical
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterCategory, MasterCategoryType } from '../../types';
import { NewCategoryModal } from './NewCategoryModal';
import { ImportCategoriesModal } from './ImportCategoriesModal';
import { exportMasterCategoriesToExcel } from '../../utils/excelCategoryUtils';
import { useCategories } from '../../hooks/useMasters';

export const CategoriesMasterTab: React.FC = () => {
  const { data: masterCategories = [] } = useCategories.useGetAll();
  const deleteMut = useCategories.useDelete();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteAll = () => {
    if (masterCategories.length === 0) return;
    if (window.confirm("Are you sure you want to delete ALL categories? This action cannot be undone.")) {
      masterCategories.forEach(c => deleteMut.mutate(c.id));
    }
  };

  const [activeTypeTab, setActiveTypeTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<MasterCategory | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Group into Root parents and their 1-level children
  const { rootCategories, childCategoriesMap, totalCount } = useMemo(() => {
    let filtered = masterCategories;
    if (activeTypeTab !== 'ALL') {
      filtered = filtered.filter(c => c.type === activeTypeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description?.toLowerCase().includes(q)
      );
    }

    const roots = filtered.filter(c => !c.parentId);
    const childMap: Record<string, MasterCategory[]> = {};

    masterCategories.forEach(c => {
      if (c.parentId) {
        if (!childMap[c.parentId]) childMap[c.parentId] = [];
        childMap[c.parentId].push(c);
      }
    });

    return {
      rootCategories: roots,
      childCategoriesMap: childMap,
      totalCount: filtered.length
    };
  }, [masterCategories, activeTypeTab, searchQuery]);

  const handleDelete = (cat: MasterCategory) => {
    setActionError(null);
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      deleteMut.mutate(cat.id, {
        onError: (err: any) => setActionError(err.message || 'Failed to delete category.')
      });
    }
  };

  const incomeCount = masterCategories.filter(c => c.type === 'INCOME').length;
  const expenseCount = masterCategories.filter(c => c.type === 'EXPENSE').length;
  const parentGroupsCount = masterCategories.filter(c => !c.parentId).length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Categories</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{masterCategories.length}</div>
          <div className="text-[11px] text-secondary mt-0.5">Chart of accounts classifications</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Income Categories</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-serif text-emerald-700">{incomeCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">Revenue & sales streams</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expense Categories</span>
            <TrendingDown className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-800">{expenseCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">COGS, Opex & overheads</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Parent Groups</span>
            <FolderTree className="w-4 h-4 text-secondary-dark" />
          </div>
          <div className="text-xl font-bold font-serif text-text">{parentGroupsCount}</div>
          <div className="text-[11px] text-secondary mt-0.5">1-Level root groupings</div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">Dismiss</button>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-text placeholder-secondary/60 focus:outline-hidden focus:border-primary focus:bg-white transition"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTypeTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'ALL'
                ? 'bg-text text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-text'
            }`}
          >
            All ({masterCategories.length})
          </button>
          <button
            onClick={() => setActiveTypeTab('INCOME')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeTab === 'INCOME'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-emerald-800'
            }`}
          >
            <span>📈 Income ({incomeCount})</span>
          </button>
          <button
            onClick={() => setActiveTypeTab('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeTab === 'EXPENSE'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-surface-muted text-secondary hover:text-amber-900'
            }`}
          >
            <span>📉 Expenses ({expenseCount})</span>
          </button>
        </div>

        {/* Actions Dropdown & Add Category Button */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 relative" ref={actionsRef}>
          <button
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-muted text-secondary hover:text-text border border-border transition cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
            title="More Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {isActionsOpen && (
            <div className="absolute top-full mt-2 right-[115px] md:right-[130px] z-50 w-48 bg-white border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-1">
              <button
                onClick={() => { exportMasterCategoriesToExcel(masterCategories); setIsActionsOpen(false); }}
                className="px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-surface-muted hover:text-text transition cursor-pointer flex items-center gap-2 w-full text-left"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => { setIsImportModalOpen(true); setIsActionsOpen(false); }}
                className="px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-surface-muted hover:text-text transition cursor-pointer flex items-center gap-2 w-full text-left"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Import Excel</span>
              </button>
              <div className="h-px bg-border my-1 w-full" />
              <button
                onClick={() => { handleDeleteAll(); setIsActionsOpen(false); }}
                disabled={masterCategories.length === 0}
                className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-2 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All</span>
              </button>
            </div>
          )}

          <button
            onClick={() => { setCategoryToEdit(null); setIsModalOpen(true); }}
            className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-[#4d5541] text-white transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* 1-Level Hierarchy Visual Tree */}
      <div className="space-y-4">
        {rootCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center text-secondary">
            <FolderTree className="w-10 h-10 mx-auto text-secondary/40 mb-2" />
            <h4 className="font-bold text-text text-sm">No Categories Found</h4>
            <p className="text-xs mt-1">Try adjusting your search query or add a new category to get started.</p>
          </div>
        ) : (
          rootCategories.map((root) => {
            const children = childCategoriesMap[root.id] || [];
            const isIncome = root.type === 'INCOME';

            return (
              <div key={root.id} className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
                {/* Parent / Root Group Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-surface-muted/40 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-2xs"
                      style={{ backgroundColor: root.color || (isIncome ? '#5B6547' : '#8C735D') }}
                    >
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-sm text-text truncate">
                          {root.name}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isIncome ? 'Income Group' : 'Expense Group'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary truncate mt-0.5">
                        {root.description || 'Top-level consolidated financial group'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-bold text-secondary bg-white px-2.5 py-1 rounded-lg border border-border hidden sm:inline">
                      {children.length} {children.length === 1 ? 'Sub-category' : 'Sub-categories'}
                    </span>
                    <button
                      onClick={() => { setCategoryToEdit(root); setIsModalOpen(true); }}
                      className="p-2 text-secondary hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-border transition cursor-pointer"
                      title="Edit Parent Group"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(root)}
                      className="p-2 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title="Delete Parent Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Categories (Children) */}
                <div className="divide-y divide-border/60">
                  {children.length === 0 ? (
                    <div className="p-4 pl-12 text-xs text-secondary italic">
                      No sub-categories assigned under this parent group yet. Click "New Category" to add one.
                    </div>
                  ) : (
                    children.map((child) => (
                      <div 
                        key={child.id}
                        className="p-3.5 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-surface-muted/30 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pl-3 sm:pl-6">
                          <CornerDownRight className="w-4 h-4 text-secondary/60 shrink-0" />
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: child.color || root.color || '#5B6547' }}
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-text block truncate">
                              {child.name}
                            </span>
                            {child.description && (
                              <span className="text-[11px] text-secondary block truncate mt-0.5">
                                {child.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => { setCategoryToEdit(child); setIsModalOpen(true); }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-border transition cursor-pointer"
                            title="Edit Sub-Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(child)}
                            className="p-1.5 text-secondary hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Delete Sub-Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <NewCategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCategoryToEdit(null); }}
        categoryToEdit={categoryToEdit}
        initialType={activeTypeTab === 'INCOME' ? 'INCOME' : 'EXPENSE'}
      />

      <ImportCategoriesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
