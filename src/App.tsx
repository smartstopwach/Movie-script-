import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clapperboard,
  Download,
  Moon,
  Plus,
  Printer,
  Sun,
} from 'lucide-react';
import { ElementType, GenreType, ScriptElement, ThemeMode } from './types';
import { createProjectFromGenre, GENRE_LIST, uid } from './templates';

interface SavedStory {
  id: string;
  title: string;
  author: string;
  genre: GenreType;
  elements: ScriptElement[];
  notes: string;
}

const STORIES_KEY = 'simple_movie_stories_v1';
const ACTIVE_STORY_KEY = 'simple_movie_active_story_v1';
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
  scene: 'Scene',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
};

const ELEMENT_PLACEHOLDERS: Record<ElementType, string> = {
  scene: 'INT. LOCATION - DAY',
  action: 'Describe what happens...',
  character: 'CHARACTER NAME',
  parenthetical: '(beat)',
  dialogue: 'Character speaks...',
  transition: 'CUT TO:',
};

function getNextType(current: ElementType): ElementType {
  if (current === 'scene') return 'action';
  if (current === 'character' || current === 'parenthetical') return 'dialogue';
  if (current === 'dialogue') return 'action';
  if (current === 'transition') return 'scene';
  return 'action';
}

export function App() {
  const [stories, setStories] = useState<SavedStory[]>(() => {
    try {
      const saved = localStorage.getItem(STORIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const demo = createProjectFromGenre('Romance / Drama', 'THE LAST TRAIN TO VARANASI');
    return [
      {
        id: demo.id,
        title: demo.title,
        author: demo.author,
        genre: demo.genre,
        elements: demo.elements,
        notes:
          'RESEARCH & IDEAS:\n• Location: Varanasi Junction at midnight, monsoon rain.\n• Character: Aarav (28) & Meera (26) meeting after 5 years.\n• Tone: Warm, nostalgic, cinematic.',
      },
    ];
  });

  const [activeStoryId, setActiveStoryId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_STORY_KEY) || stories[0].id;
  });

  const currentStory = useMemo(
    () => stories.find((s) => s.id === activeStoryId) || stories[0],
    [stories, activeStoryId]
  );

  const title = currentStory.title;
  const author = currentStory.author;
  const genre = currentStory.genre;
  const elements = currentStory.elements;
  const notes = currentStory.notes;

  const updateStory = (patch: Partial<SavedStory>) => {
    setStories((prev) =>
      prev.map((s) => (s.id === currentStory.id ? { ...s, ...patch } : s))
    );
  };

  const setTitle = (t: string) => updateStory({ title: t });
  const setAuthor = (a: string) => updateStory({ author: a });
  const setGenre = (g: GenreType) => updateStory({ genre: g });
  const setElements = (
    updater: ScriptElement[] | ((prev: ScriptElement[]) => ScriptElement[])
  ) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== currentStory.id) return s;
        const nextElements =
          typeof updater === 'function' ? updater(s.elements) : updater;
        return { ...s, elements: nextElements };
      })
    );
  };
  const setNotes = (n: string) => updateStory({ notes: n });

  const createNewStory = () => {
    const newTitle = `UNTITLED STORY ${stories.length + 1}`;
    const newStory: SavedStory = {
      id: uid(),
      title: newTitle,
      author: 'Screenwriter',
      genre: 'Feature Film',
      elements: [
        { id: uid(), type: 'transition', text: 'FADE IN:' },
        { id: uid(), type: 'scene', text: 'INT. LOCATION - DAY' },
        { id: uid(), type: 'action', text: '' },
      ],
      notes: 'Research & ideas for this story...',
    };
    setStories((prev) => [newStory, ...prev]);
    setActiveStoryId(newStory.id);
    setActiveId(newStory.elements[0].id);
  };

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'paper';
  });

  const [activeId, setActiveId] = useState<string>(() => elements[0]?.id || '');
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    localStorage.setItem(ACTIVE_STORY_KEY, currentStory.id);
  }, [stories, currentStory.id]);

  useEffect(() => {
    Object.values(inputRefs.current).forEach((el) => {
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    });
  }, [elements]);

  const activeElement = useMemo(
    () => elements.find((e) => e.id === activeId) || elements[0],
    [elements, activeId]
  );

  const scenes = useMemo(
    () => elements.filter((e) => e.type === 'scene'),
    [elements]
  );

  const updateElement = (id: string, patch: Partial<ScriptElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...patch } : el))
    );
  };

  const insertAfter = (afterId: string, type: ElementType = 'action') => {
    const newEl: ScriptElement = { id: uid(), type, text: '' };
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === afterId);
      const next = [...prev];
      next.splice(idx === -1 ? next.length : idx + 1, 0, newEl);
      return next;
    });
    setActiveId(newEl.id);
    setTimeout(() => inputRefs.current[newEl.id]?.focus(), 10);
  };

  const removeElement = (id: string) => {
    if (elements.length <= 1) return;
    const idx = elements.findIndex((e) => e.id === id);
    const prevEl = elements[Math.max(0, idx - 1)];
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (prevEl) {
      setActiveId(prevEl.id);
      setTimeout(() => inputRefs.current[prevEl.id]?.focus(), 10);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    el: ScriptElement
  ) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = ELEMENT_ORDER.indexOf(el.type);
      updateElement(el.id, {
        type: ELEMENT_ORDER[(idx + 1) % ELEMENT_ORDER.length],
      });
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertAfter(el.id, getNextType(el.type));
    } else if (e.key === 'Backspace' && el.text === '' && elements.length > 1) {
      e.preventDefault();
      removeElement(el.id);
    }
  };

  const downloadScript = () => {
    const lines = [`${title.toUpperCase()}`, `Written by ${author}`, `Genre: ${genre}`, ''];
    elements.forEach((el) => {
      if (!el.text.trim()) return;
      if (el.type === 'scene' || el.type === 'character' || el.type === 'transition') {
        lines.push(`\n${el.text.toUpperCase()}`);
      } else {
        lines.push(el.text);
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* SIMPLE TOP BAR */}
      <header
        className="no-print"
        style={{
          height: 54,
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
          <Clapperboard size={20} color="var(--accent)" />
          <strong style={{ fontSize: 15 }}>Movie Script Writer</strong>
          <select
            value={currentStory.id}
            onChange={(e) => {
              setActiveStoryId(e.target.value);
              const found = stories.find((s) => s.id === e.target.value);
              if (found) setActiveId(found.elements[0]?.id || '');
            }}
            style={{
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              maxWidth: 180,
            }}
            title="Switch Story"
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button onClick={createNewStory} style={btnStyle('secondary')} title="New Story">
            <Plus size={14} />
            <span>New</span>
          </button>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as GenreType)}
            style={{
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
            }}
          >
            {GENRE_LIST.map((g) => (
              <option key={g.genre} value={g.genre}>
                {g.genre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setTheme(theme === 'cinema' ? 'paper' : 'cinema')}
            style={btnStyle('secondary')}
            title="Switch Light / Dark"
          >
            {theme === 'cinema' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => window.print()} style={btnStyle('secondary')}>
            <Printer size={15} />
            <span>PDF</span>
          </button>
          <button onClick={downloadScript} style={btnStyle('primary')}>
            <Download size={15} />
            <span>Save .txt</span>
          </button>
        </div>
      </header>

      {/* SIMPLE 2-COLUMN WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: SCENES + RESEARCH NOTES */}
        <aside
          className="no-print"
          style={{
            width: 260,
            background: 'var(--bg-panel)',
            borderRight: '1px solid var(--border)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={labelStyle}>Scenes ({scenes.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {scenes.map((sc, i) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setActiveId(sc.id);
                    inputRefs.current[sc.id]?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    inputRefs.current[sc.id]?.focus();
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '7px 9px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background:
                      activeId === sc.id ? 'var(--accent-soft)' : 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: "'Courier Prime', monospace",
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {i + 1}. {sc.text || 'UNTITLED SCENE'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={labelStyle}>Research & Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your research, character ideas, locations..."
              style={{
                flex: 1,
                minHeight: 200,
                marginTop: 8,
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
        </aside>

        {/* CENTER: SCREENPLAY EDITOR */}
        <main
          className="print-only-container"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Format Bar */}
          <div
            className="no-print"
            style={{
              padding: '8px 12px',
              background: 'var(--bg-panel)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {ELEMENT_ORDER.map((type) => {
                const active = activeElement?.type === type;
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
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
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

            {/* Easy Quick-Insert Chips while typing */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {activeElement?.type === 'scene' &&
                ['INT. ', 'EXT. ', ' - DAY', ' - NIGHT'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      updateElement(activeElement.id, { text: activeElement.text + chip });
                      inputRefs.current[activeElement.id]?.focus();
                    }}
                    style={chipStyle}
                  >
                    +{chip.trim()}
                  </button>
                ))}
              {activeElement?.type === 'character' &&
                [' (V.O.)', ' (O.S.)', " (CONT'D)"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      updateElement(activeElement.id, { text: activeElement.text + chip });
                      inputRefs.current[activeElement.id]?.focus();
                    }}
                    style={chipStyle}
                  >
                    +{chip.trim()}
                  </button>
                ))}
              {activeElement?.type === 'transition' &&
                ['CUT TO:', 'FADE IN:', 'FADE OUT.', 'DISSOLVE TO:'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      updateElement(activeElement.id, { text: chip });
                      inputRefs.current[activeElement.id]?.focus();
                    }}
                    style={chipStyle}
                  >
                    {chip}
                  </button>
                ))}
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Enter = Next line • Tab = Switch format
              </span>
            </div>
          </div>

          {/* Paper */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 60px 16px' }}>
            <div className="screenplay-page">
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: 28,
                  marginBottom: 24,
                  borderBottom: '1px dashed var(--border)',
                }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 20,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'inherit',
                    marginBottom: 6,
                  }}
                />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Written by{' '}
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'inherit',
                      textDecoration: 'underline',
                      width: 140,
                    }}
                  />
                </div>
              </div>

              {elements.map((el) => (
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

              <div className="no-print" style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={() =>
                    insertAfter(elements[elements.length - 1]?.id || '', 'action')
                  }
                  style={btnStyle('secondary')}
                >
                  <Plus size={14} /> Add Line
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function btnStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 7,
    border: variant === 'primary' ? 'none' : '1px solid var(--border)',
    background: variant === 'primary' ? 'var(--accent)' : 'var(--bg-app)',
    color: variant === 'primary' ? '#ffffff' : 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
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

export default App;
