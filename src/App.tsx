import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Check,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  FolderOpen,
  ListTree,
  Moon,
  Plus,
  Printer,
  Redo2,
  Replace,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  BeatItem,
  CharacterProfile,
  ElementType,
  GenreType,
  ResearchCategory,
  ResearchNote,
  ScriptElement,
  ScriptProject,
  ThemeMode,
} from './types';
import { createProjectFromGenre, GENRE_LIST, uid } from './templates';

const PROJECTS_KEY = 'movie_script_writer_projects_v2';
const ACTIVE_ID_KEY = 'movie_script_writer_active_id_v2';
const THEME_KEY = 'movie_script_writer_theme_v1';

const ELEMENT_ORDER: ElementType[] = [
  'scene',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
];

const ELEMENT_LABELS: Record<ElementType, string> = {
  scene: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
};

const ELEMENT_PLACEHOLDERS: Record<ElementType, string> = {
  scene: 'INT. LOCATION - DAY',
  action: 'Describe what we see and hear...',
  character: 'CHARACTER NAME',
  parenthetical: '(beat)',
  dialogue: 'Character speaks...',
  transition: 'CUT TO:',
};

function getNextElementType(current: ElementType): ElementType {
  switch (current) {
    case 'scene':
      return 'action';
    case 'character':
      return 'dialogue';
    case 'parenthetical':
      return 'dialogue';
    case 'dialogue':
      return 'action';
    case 'transition':
      return 'scene';
    default:
      return 'action';
  }
}

export function App() {
  const [projects, setProjects] = useState<ScriptProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [createProjectFromGenre('Thriller / Mystery', 'THE MIDNIGHT ARCHIVE')];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_ID_KEY) || projects[0].id;
  });

  const project = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  // Undo / Redo history for elements
  const [history, setHistory] = useState<ScriptElement[][]>([]);
  const [redoStack, setRedoStack] = useState<ScriptElement[][]>([]);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return saved || 'paper';
  });

  const [activeId, setActiveId] = useState<string>(
    () => project.elements[0]?.id || ''
  );
  const [leftTab, setLeftTab] = useState<'scenes' | 'beats' | 'characters'>(
    'scenes'
  );
  const [rightTab, setRightTab] = useState<'research' | 'analytics' | 'guide'>(
    'research'
  );
  const [focusMode, setFocusMode] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GenreType>('Feature Film');
  const [researchFilter, setResearchFilter] = useState<
    ResearchCategory | 'All'
  >('All');
  const [researchQuery, setResearchQuery] = useState('');
  const [savedNotice, setSavedNotice] = useState('Saved');

  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateProject = (updater: (prev: ScriptProject) => ScriptProject) => {
    setProjects((prevList) =>
      prevList.map((p) => (p.id === project.id ? updater(p) : p))
    );
  };

  const pushHistory = (elements: ScriptElement[]) => {
    setHistory((h) => [...h.slice(-29), elements]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((r) => [...r, project.elements]);
    setHistory((h) => h.slice(0, -1));
    updateProject((p) => ({ ...p, elements: previous }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, project.elements]);
    setRedoStack((r) => r.slice(0, -1));
    updateProject((p) => ({ ...p, elements: next }));
  };

  // Persist theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Auto-save projects
  useEffect(() => {
    setSavedNotice('Saving...');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(ACTIVE_ID_KEY, project.id);
        setSavedNotice('Saved');
      } catch {
        setSavedNotice('Storage full');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [projects, project.id]);

  // Auto-resize all textareas
  useEffect(() => {
    Object.values(inputRefs.current).forEach((el) => {
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    });
  }, [project.elements, activeProjectId]);

  const activeElement = useMemo(
    () => project.elements.find((e) => e.id === activeId) || project.elements[0],
    [project.elements, activeId]
  );

  const scenes = useMemo(() => {
    const list: { id: string; text: string; startIdx: number; endIdx: number }[] = [];
    project.elements.forEach((el, idx) => {
      if (el.type === 'scene') {
        if (list.length > 0) list[list.length - 1].endIdx = idx - 1;
        list.push({ id: el.id, text: el.text, startIdx: idx, endIdx: project.elements.length - 1 });
      }
    });
    return list;
  }, [project.elements]);

  const stats = useMemo(() => {
    let words = 0;
    let dialogueWords = 0;
    let actionWords = 0;
    const charCounts: Record<string, number> = {};
    let lastChar = '';

    project.elements.forEach((el) => {
      const w = el.text.trim() ? el.text.trim().split(/\s+/).length : 0;
      words += w;
      if (el.type === 'dialogue') {
        dialogueWords += w;
        if (lastChar) {
          charCounts[lastChar] = (charCounts[lastChar] || 0) + 1;
        }
      } else if (el.type === 'action') {
        actionWords += w;
      } else if (el.type === 'character') {
        lastChar = el.text.trim().replace(/\s*\(.*?\)\s*/g, '').toUpperCase();
      }
    });

    const totalDA = Math.max(1, dialogueWords + actionWords);
    const dialoguePct = Math.round((dialogueWords / totalDA) * 100);
    const actionPct = 100 - dialoguePct;
    const pages = Math.max(1, Math.ceil(words / 180));

    const topCharacters = Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      words,
      pages,
      scenes: scenes.length,
      dialoguePct,
      actionPct,
      topCharacters,
    };
  }, [project.elements, scenes.length]);

  const uniqueCharacters = useMemo(() => {
    const set = new Set<string>();
    project.characters.forEach((c) => c.name && set.add(c.name.toUpperCase()));
    project.elements.forEach((el) => {
      if (el.type === 'character' && el.text.trim()) {
        set.add(el.text.trim().toUpperCase());
      }
    });
    return Array.from(set).slice(0, 8);
  }, [project.characters, project.elements]);

  const updateElement = (id: string, patch: Partial<ScriptElement>) => {
    updateProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, ...patch } : el
      ),
    }));
  };

  const insertElementAfter = (
    afterId: string,
    type: ElementType = 'action',
    text = ''
  ) => {
    pushHistory(project.elements);
    const newEl: ScriptElement = { id: uid(), type, text };
    updateProject((prev) => {
      const idx = prev.elements.findIndex((e) => e.id === afterId);
      const next = [...prev.elements];
      next.splice(idx === -1 ? next.length : idx + 1, 0, newEl);
      return { ...prev, updatedAt: new Date().toISOString(), elements: next };
    });
    setActiveId(newEl.id);
    setTimeout(() => {
      inputRefs.current[newEl.id]?.focus();
    }, 10);
  };

  const removeElement = (id: string) => {
    if (project.elements.length <= 1) return;
    pushHistory(project.elements);
    const idx = project.elements.findIndex((e) => e.id === id);
    const prevEl = project.elements[Math.max(0, idx - 1)];
    updateProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      elements: prev.elements.filter((e) => e.id !== id),
    }));
    if (prevEl) {
      setActiveId(prevEl.id);
      setTimeout(() => {
        inputRefs.current[prevEl.id]?.focus();
      }, 10);
    }
  };

  const moveScene = (sceneIndex: number, direction: -1 | 1) => {
    const targetIdx = sceneIndex + direction;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    pushHistory(project.elements);

    const s1 = scenes[sceneIndex];
    const s2 = scenes[targetIdx];
    const block1 = project.elements.slice(s1.startIdx, s1.endIdx + 1);
    const block2 = project.elements.slice(s2.startIdx, s2.endIdx + 1);

    const before = project.elements.slice(
      0,
      Math.min(s1.startIdx, s2.startIdx)
    );
    const after = project.elements.slice(
      Math.max(s1.endIdx, s2.endIdx) + 1
    );

    const reordered =
      direction === -1
        ? [...before, ...block1, ...block2, ...after]
        : [...before, ...block2, ...block1, ...after];

    updateProject((p) => ({ ...p, elements: reordered }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    el: ScriptElement
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      pushHistory(project.elements);
      const idx = ELEMENT_ORDER.indexOf(el.type);
      const nextType = ELEMENT_ORDER[(idx + 1) % ELEMENT_ORDER.length];
      updateElement(el.id, { type: nextType });
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertElementAfter(el.id, getNextElementType(el.type));
    } else if (e.key === 'Backspace' && el.text === '' && project.elements.length > 1) {
      e.preventDefault();
      removeElement(el.id);
    }
  };

  const scrollToElement = (id: string) => {
    setActiveId(id);
    const el = inputRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    pushHistory(project.elements);
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    updateProject((p) => ({
      ...p,
      elements: p.elements.map((el) => ({
        ...el,
        text: el.text.replace(regex, replaceText),
      })),
    }));
  };

  // Export functions
  const exportFountain = () => {
    const lines: string[] = [
      `Title: ${project.title}`,
      `Credit: Written by`,
      `Author: ${project.author}`,
      `Genre: ${project.genre}`,
      '',
      '===',
      '',
    ];
    project.elements.forEach((el) => {
      const t = el.text.trim();
      if (!t) return;
      if (el.type === 'scene') lines.push(`\n${t.toUpperCase()}\n`);
      else if (el.type === 'character') lines.push(`\n${t.toUpperCase()}`);
      else if (el.type === 'parenthetical') lines.push(t);
      else if (el.type === 'dialogue') lines.push(`${t}\n`);
      else if (el.type === 'transition') lines.push(`\n> ${t.toUpperCase()}\n`);
      else lines.push(`\n${t}\n`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content) as ScriptProject;
          if (parsed.elements && Array.isArray(parsed.elements)) {
            const imported = { ...parsed, id: uid() };
            setProjects((prev) => [imported, ...prev]);
            setActiveProjectId(imported.id);
          }
        } catch {
          alert('Invalid JSON project file.');
        }
      } else {
        // Parse .fountain or .txt
        const lines = content.split(/\r?\n/);
        const elements: ScriptElement[] = [];
        lines.forEach((raw) => {
          const line = raw.trim();
          if (!line) return;
          if (/^(INT\.|EXT\.|INT\.\/EXT\.)/i.test(line)) {
            elements.push({ id: uid(), type: 'scene', text: line.toUpperCase() });
          } else if (/^>/.test(line) || /^(CUT TO:|FADE IN:|FADE OUT\.|DISSOLVE TO:)$/i.test(line)) {
            elements.push({ id: uid(), type: 'transition', text: line.replace(/^>\s*/, '').toUpperCase() });
          } else if (/^\(.*\)$/.test(line)) {
            elements.push({ id: uid(), type: 'parenthetical', text: line });
          } else if (line === line.toUpperCase() && line.length < 35 && /[A-Z]/.test(line)) {
            elements.push({ id: uid(), type: 'character', text: line });
          } else {
            const prev = elements[elements.length - 1];
            if (prev && (prev.type === 'character' || prev.type === 'parenthetical')) {
              elements.push({ id: uid(), type: 'dialogue', text: line });
            } else {
              elements.push({ id: uid(), type: 'action', text: line });
            }
          }
        });
        if (elements.length > 0) {
          const imported = createProjectFromGenre(
            'Feature Film',
            file.name.replace(/\.(fountain|txt)$/i, '').toUpperCase()
          );
          imported.elements = elements;
          setProjects((prev) => [imported, ...prev]);
          setActiveProjectId(imported.id);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Beats handlers
  const toggleBeat = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      beats: prev.beats.map((b) => (b.id === id ? { ...b, done: !b.done } : b)),
    }));
  };

  const addBeat = () => {
    const newBeat: BeatItem = {
      id: uid(),
      act: 'Act II',
      title: 'New Story Beat',
      description: 'Describe what happens in this beat...',
      done: false,
    };
    updateProject((prev) => ({ ...prev, beats: [...prev.beats, newBeat] }));
  };

  // Research handlers
  const addResearchNote = () => {
    const note: ResearchNote = {
      id: uid(),
      category: researchFilter === 'All' ? 'Reference' : researchFilter,
      title: 'New Research Note',
      content: 'Add facts, location details, dialogue ideas, or references...',
      updatedAt: new Date().toLocaleDateString(),
    };
    updateProject((prev) => ({ ...prev, research: [note, ...prev.research] }));
  };

  const updateResearchNote = (id: string, patch: Partial<ResearchNote>) => {
    updateProject((prev) => ({
      ...prev,
      research: prev.research.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toLocaleDateString() } : n
      ),
    }));
  };

  const deleteResearchNote = (id: string) => {
    updateProject((prev) => ({
      ...prev,
      research: prev.research.filter((n) => n.id !== id),
    }));
  };

  // Character handlers
  const addCharacter = () => {
    const char: CharacterProfile = {
      id: uid(),
      name: 'NEW CHARACTER',
      role: 'Supporting',
      arc: 'Character goal and transformation...',
      traits: 'Key traits',
    };
    updateProject((prev) => ({ ...prev, characters: [...prev.characters, char] }));
  };

  const updateCharacter = (id: string, patch: Partial<CharacterProfile>) => {
    updateProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };

  const filteredResearch = useMemo(() => {
    return project.research.filter((n) => {
      const catMatch = researchFilter === 'All' || n.category === researchFilter;
      const q = researchQuery.toLowerCase();
      const qMatch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [project.research, researchFilter, researchQuery]);

  const handleCreateNewProject = () => {
    const fresh = createProjectFromGenre(selectedGenre, newTitle);
    setProjects((prev) => [fresh, ...prev]);
    setActiveProjectId(fresh.id);
    setActiveId(fresh.elements[0]?.id || '');
    setShowNewModal(false);
    setNewTitle('');
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      setActiveProjectId(remaining[0].id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* TOP BAR */}
      <header
        className="no-print"
        style={{
          height: 56,
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clapperboard size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={project.title}
                onChange={(e) =>
                  updateProject((p) => ({ ...p, title: e.target.value }))
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  width: 200,
                }}
                aria-label="Script Title"
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                {project.genre}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Movie Script Writer • {savedNotice}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setShowProjectsModal(true)}
            style={btnStyle('secondary')}
            title="Manage Scripts"
          >
            <FolderOpen size={15} />
            <span>Scripts ({projects.length})</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            style={btnStyle('secondary')}
            title="New Script from Genre Template"
          >
            <Plus size={15} />
            <span>New</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={btnStyle('secondary')}
            title="Import .fountain, .txt, or .json"
          >
            <Upload size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fountain,.txt,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => setShowFindReplace((s) => !s)}
            style={btnStyle(showFindReplace ? 'primary' : 'secondary')}
            title="Find & Replace"
          >
            <Replace size={15} />
          </button>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            style={{
              ...btnStyle('secondary'),
              opacity: history.length === 0 ? 0.4 : 1,
            }}
            title="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            style={{
              ...btnStyle('secondary'),
              opacity: redoStack.length === 0 ? 0.4 : 1,
            }}
            title="Redo"
          >
            <Redo2 size={15} />
          </button>

          <button
            onClick={() => setFocusMode((f) => !f)}
            style={btnStyle(focusMode ? 'primary' : 'secondary')}
            title="Toggle Focus Mode"
          >
            {focusMode ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-app)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            {(
              [
                { id: 'paper', icon: <FileText size={14} />, label: 'Paper' },
                { id: 'light', icon: <Sun size={14} />, label: 'Light' },
                { id: 'cinema', icon: <Moon size={14} />, label: 'Cinema' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`${t.label} Theme`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 7px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: theme === t.id ? 'var(--bg-panel)' : 'transparent',
                  color:
                    theme === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            style={btnStyle('secondary')}
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            <span>PDF</span>
          </button>

          <button
            onClick={exportFountain}
            style={btnStyle('primary')}
            title="Export .fountain screenplay"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* FIND & REPLACE BAR */}
      {showFindReplace && (
        <div
          className="no-print"
          style={{
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <input
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find text..."
            style={smallInputStyle}
          />
          <input
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            style={smallInputStyle}
          />
          <button onClick={handleReplaceAll} style={btnStyle('primary')}>
            Replace All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            style={btnStyle('secondary')}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT SIDEBAR */}
        {!focusMode && (
          <aside
            className="no-print"
            style={{
              width: 280,
              background: 'var(--bg-panel)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                padding: '6px 8px',
                gap: 4,
              }}
            >
              {(
                [
                  { id: 'scenes', label: 'Scenes', icon: <Film size={14} /> },
                  { id: 'beats', label: 'Beats', icon: <ListTree size={14} /> },
                  { id: 'characters', label: 'Cast', icon: <Users size={14} /> },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      leftTab === tab.id ? 'var(--accent-soft)' : 'transparent',
                    color:
                      leftTab === tab.id
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {leftTab === 'scenes' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span style={sectionLabelStyle}>
                      Scene Outline ({scenes.length})
                    </span>
                    <button
                      onClick={() =>
                        insertElementAfter(
                          project.elements[project.elements.length - 1]?.id || '',
                          'scene',
                          'INT. NEW LOCATION - DAY'
                        )
                      }
                      style={miniBtnStyle}
                    >
                      <Plus size={13} /> Scene
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {scenes.map((sc, i) => (
                      <div
                        key={sc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background:
                            activeId === sc.id
                              ? 'var(--accent-soft)'
                              : 'var(--bg-app)',
                        }}
                      >
                        <button
                          onClick={() => scrollToElement(sc.id)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: "'Courier Prime', monospace",
                            fontWeight: 700,
                            padding: 0,
                          }}
                        >
                          <span style={{ color: 'var(--accent)', marginRight: 5 }}>
                            {i + 1}.
                          </span>
                          {sc.text || 'UNTITLED SCENE'}
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            onClick={() => moveScene(i, -1)}
                            disabled={i === 0}
                            style={iconTinyBtn}
                            title="Move scene up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            onClick={() => moveScene(i, 1)}
                            disabled={i === scenes.length - 1}
                            style={iconTinyBtn}
                            title="Move scene down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leftTab === 'beats' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span style={sectionLabelStyle}>{project.genre} Beats</span>
                    <button onClick={addBeat} style={miniBtnStyle}>
                      <Plus size={13} /> Beat
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {project.beats.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-app)',
                          opacity: b.done ? 0.75 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--accent)',
                            }}
                          >
                            {b.act}
                          </span>
                          <button
                            onClick={() => toggleBeat(b.id)}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              background: b.done ? 'var(--accent)' : 'transparent',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            {b.done && <Check size={12} />}
                          </button>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: b.done ? 'line-through' : 'none',
                            marginBottom: 2,
                          }}
                        >
                          {b.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {b.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leftTab === 'characters' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span style={sectionLabelStyle}>
                      Characters ({project.characters.length})
                    </span>
                    <button onClick={addCharacter} style={miniBtnStyle}>
                      <Plus size={13} /> Cast
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {project.characters.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-app)',
                        }}
                      >
                        <input
                          value={c.name}
                          onChange={(e) =>
                            updateCharacter(c.id, { name: e.target.value })
                          }
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            marginBottom: 4,
                          }}
                        />
                        <input
                          value={c.role}
                          onChange={(e) =>
                            updateCharacter(c.id, { role: e.target.value })
                          }
                          placeholder="Role"
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: 11,
                            color: 'var(--accent)',
                            fontWeight: 600,
                            marginBottom: 6,
                          }}
                        />
                        <textarea
                          value={c.arc}
                          onChange={(e) =>
                            updateCharacter(c.id, { arc: e.target.value })
                          }
                          rows={2}
                          placeholder="Character arc..."
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CENTER: SCREENPLAY EDITOR */}
        <main
          className="print-only-container"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Element Formatting Toolbar + Smart Suggestions */}
          <div
            className="no-print"
            style={{
              padding: '8px 16px',
              background: 'var(--bg-panel)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {ELEMENT_ORDER.map((type) => {
                const isActive = activeElement?.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (activeElement) {
                        updateElement(activeElement.id, { type });
                        inputRefs.current[activeElement.id]?.focus();
                      }
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {ELEMENT_LABELS[type]}
                  </button>
                );
              })}
            </div>

            {/* Smart Quick-Insert Chips */}
            {activeElement?.type === 'scene' && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['INT. ', 'EXT. ', 'INT./EXT. ', ' - DAY', ' - NIGHT', ' - CONTINUOUS'].map(
                  (chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        updateElement(activeElement.id, {
                          text: activeElement.text + chip,
                        });
                        inputRefs.current[activeElement.id]?.focus();
                      }}
                      style={chipStyle}
                    >
                      +{chip.trim()}
                    </button>
                  )
                )}
              </div>
            )}

            {activeElement?.type === 'character' && uniqueCharacters.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {uniqueCharacters.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      updateElement(activeElement.id, { text: name });
                      inputRefs.current[activeElement.id]?.focus();
                    }}
                    style={chipStyle}
                  >
                    {name}
                  </button>
                ))}
                {[' (V.O.)', ' (O.S.)', " (CONT'D)"].map((ext) => (
                  <button
                    key={ext}
                    onClick={() => {
                      updateElement(activeElement.id, {
                        text: activeElement.text + ext,
                      });
                      inputRefs.current[activeElement.id]?.focus();
                    }}
                    style={chipStyle}
                  >
                    +{ext.trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Script Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 60px 20px' }}>
            <div className="screenplay-page">
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: 36,
                  marginBottom: 28,
                  borderBottom: '1px dashed var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  {project.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Written by{' '}
                  <input
                    value={project.author}
                    onChange={(e) =>
                      updateProject((p) => ({ ...p, author: e.target.value }))
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'inherit',
                      textAlign: 'center',
                      width: 160,
                      textDecoration: 'underline',
                    }}
                  />
                </div>
              </div>

              {project.elements.map((el) => (
                <div key={el.id} className={`sp-block sp-${el.type}`}>
                  <textarea
                    ref={(node) => {
                      inputRefs.current[el.id] = node;
                    }}
                    value={el.text}
                    rows={1}
                    placeholder={ELEMENT_PLACEHOLDERS[el.type]}
                    onFocus={() => setActiveId(el.id)}
                    onChange={(e) => {
                      updateElement(el.id, { text: e.target.value });
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => handleKeyDown(e, el)}
                    className="sp-textarea"
                  />
                </div>
              ))}

              <div
                className="no-print"
                style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
              >
                <button
                  onClick={() =>
                    insertElementAfter(
                      project.elements[project.elements.length - 1]?.id || '',
                      'action'
                    )
                  }
                  style={miniBtnStyle}
                >
                  <Plus size={14} /> Add Line
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div
            className="no-print"
            style={{
              height: 32,
              background: 'var(--bg-panel)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Est. {stats.pages} {stats.pages === 1 ? 'page' : 'pages'} (~
              {stats.pages} min) • {stats.scenes} scenes • {stats.words} words
            </div>
            <div>
              Active: <strong>{ELEMENT_LABELS[activeElement?.type || 'action']}</strong>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: RESEARCH / ANALYTICS / GUIDE */}
        {!focusMode && (
          <aside
            className="no-print"
            style={{
              width: 300,
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                padding: '6px 8px',
                gap: 4,
              }}
            >
              {(
                [
                  { id: 'research', label: 'Research', icon: <BookOpen size={13} /> },
                  { id: 'analytics', label: 'Stats', icon: <BarChart3 size={13} /> },
                  { id: 'guide', label: 'Guide', icon: <Sparkles size={13} /> },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '6px 6px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      rightTab === tab.id ? 'var(--accent-soft)' : 'transparent',
                    color:
                      rightTab === tab.id
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {rightTab === 'research' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span style={sectionLabelStyle}>Research Vault</span>
                    <button onClick={addResearchNote} style={miniBtnStyle}>
                      <Plus size={13} /> Note
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-app)',
                      marginBottom: 8,
                    }}
                  >
                    <Search size={13} color="var(--text-muted)" />
                    <input
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="Search research..."
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        width: '100%',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      flexWrap: 'wrap',
                      marginBottom: 12,
                    }}
                  >
                    {(
                      [
                        'All',
                        'Location',
                        'Character',
                        'Lore',
                        'Reference',
                        'Dialogue',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setResearchFilter(cat)}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 7px',
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background:
                            researchFilter === cat
                              ? 'var(--accent-soft)'
                              : 'transparent',
                          color:
                            researchFilter === cat
                              ? 'var(--accent)'
                              : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredResearch.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-app)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {note.category}
                          </span>
                          <button
                            onClick={() => deleteResearchNote(note.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 2,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <input
                          value={note.title}
                          onChange={(e) =>
                            updateResearchNote(note.id, { title: e.target.value })
                          }
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontWeight: 600,
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            marginBottom: 4,
                          }}
                        />
                        <textarea
                          value={note.content}
                          onChange={(e) =>
                            updateResearchNote(note.id, {
                              content: e.target.value,
                            })
                          }
                          rows={3}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'vertical',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            fontFamily: 'inherit',
                            lineHeight: 1.4,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rightTab === 'analytics' && (
                <div style={{ fontSize: 12 }}>
                  <span style={sectionLabelStyle}>Script Analytics</span>
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-app)',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Dialogue vs. Action
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: 'var(--border)',
                        overflow: 'hidden',
                        display: 'flex',
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${stats.dialoguePct}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>Dialogue: {stats.dialoguePct}%</span>
                      <span>Action: {stats.actionPct}%</span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-app)',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      Speaking Lines by Character
                    </div>
                    {stats.topCharacters.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        Add Character + Dialogue blocks to see speaking stats.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stats.topCharacters.map(([name, count]) => (
                          <div
                            key={name}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{name}</span>
                            <span style={{ color: 'var(--accent)' }}>
                              {count} {count === 1 ? 'line' : 'lines'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {rightTab === 'guide' && (
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    Screenplay Format Guide
                  </h4>
                  <p>
                    <strong>Scene Heading:</strong> Always start with{' '}
                    <code>INT.</code> or <code>EXT.</code>, followed by location
                    and time (<code>DAY</code>, <code>NIGHT</code>).
                  </p>
                  <p>
                    <strong>Action:</strong> Present tense, visual, concise.
                  </p>
                  <p>
                    <strong>Character:</strong> Centered, ALL CAPS. Add{' '}
                    <code>(V.O.)</code> or <code>(O.S.)</code>.
                  </p>
                  <p>
                    <strong>1 Page ≈ 1 Minute:</strong> Standard 12pt Courier
                    format ensures accurate runtime estimation.
                  </p>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                  <button
                    onClick={exportJSON}
                    style={{ ...btnStyle('secondary'), width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={14} /> Backup Project (.json)
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* PROJECTS MANAGER MODAL */}
      {showProjectsModal && (
        <div className="no-print" style={modalOverlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: 480 }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Your Movie Scripts</h3>
              <button onClick={() => setShowProjectsModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: p.id === project.id ? 'var(--accent)' : 'var(--border)',
                    background: p.id === project.id ? 'var(--accent-soft)' : 'var(--bg-app)',
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setActiveId(p.elements[0]?.id || '');
                      setShowProjectsModal(false);
                    }}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {p.genre} • {p.elements.length} blocks
                    </div>
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => deleteProject(p.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Delete script"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW SCRIPT FROM GENRE MODAL */}
      {showNewModal && (
        <div className="no-print" style={modalOverlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: 640 }}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Create New Movie Script</h3>
              <button onClick={() => setShowNewModal(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter your movie title (e.g. THE LAST SIGNAL)..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: 14,
                marginBottom: 14,
                outline: 'none',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 8,
                marginBottom: 18,
              }}
            >
              {GENRE_LIST.map((g) => {
                const active = selectedGenre === g.genre;
                return (
                  <button
                    key={g.genre}
                    onClick={() => setSelectedGenre(g.genre)}
                    style={{
                      textAlign: 'left',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      background: active ? 'var(--accent-soft)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: active ? 'var(--accent)' : 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {g.genre}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {g.tagline}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowNewModal(false)} style={btnStyle('secondary')}>
                Cancel
              </button>
              <button onClick={handleCreateNewProject} style={btnStyle('primary')}>
                Start Writing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 8,
    border: variant === 'primary' ? 'none' : '1px solid var(--border)',
    background: variant === 'primary' ? 'var(--accent)' : 'var(--bg-app)',
    color: variant === 'primary' ? '#ffffff' : 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const miniBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-app)',
  color: 'var(--text-primary)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const chipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--bg-app)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

const iconTinyBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 1,
  display: 'flex',
};

const smallInputStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-app)',
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 50,
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

export default App;
