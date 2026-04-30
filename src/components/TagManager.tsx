'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { nanoid } from 'nanoid';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export function TagManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const locale = useTaskStore((s) => s.locale);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);

  // Collect all unique tags from all tasks
  const allTags = getAllTags(tasks);

  // Get tag usage counts
  const tagCounts = getTagCounts(tasks);

  function handleAddTag() {
    if (!newTagName.trim()) return;
    // Tags are stored per-row, so this just updates the UI
    setNewTagName('');
    setNewTagColor(PRESET_COLORS[(allTags.length) % PRESET_COLORS.length]);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        title={t(locale, 'manageTags')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{t(locale, 'manageTags')}</span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">×</button>
            </div>

            {/* Add new tag */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t(locale, 'addTag')}
                className="flex-1 px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={() => setNewTagColor(PRESET_COLORS[(allTags.length) % PRESET_COLORS.length])}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 shadow"
                style={{ backgroundColor: newTagColor }}
              />
              <button onClick={handleAddTag} className="text-blue-500 hover:text-blue-700 text-sm">+</button>
            </div>

            {/* Color picker */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-5 h-5 rounded-full ${newTagColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Existing tags list */}
            {allTags.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">{t(locale, 'noTags')}</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                      <span className="text-xs text-zinc-400">({tagCounts[tag.name] || 0})</span>
                    </div>
                    <button className="text-zinc-400 hover:text-red-500 text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function getAllTags(tasks: { rows: { tags?: string[] }[] }[]) {
  const tagMap = new Map<string, string>();
  for (const task of tasks) {
    for (const row of task.rows) {
      if (row.tags) {
        for (const tag of row.tags) {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, PRESET_COLORS[tagMap.size % PRESET_COLORS.length]);
          }
        }
      }
    }
  }
  return Array.from(tagMap.entries()).map(([name, color]) => ({ name, color }));
}

function getTagCounts(tasks: { rows: { tags?: string[] }[] }[]) {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    for (const row of task.rows) {
      if (row.tags) {
        for (const tag of row.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
    }
  }
  return counts;
}