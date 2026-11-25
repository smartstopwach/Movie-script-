export type ElementType =
  | 'scene'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition';

export interface ScriptElement {
  id: string;
  type: ElementType;
  text: string;
}

export interface BeatItem {
  id: string;
  act: string;
  title: string;
  description: string;
  done: boolean;
}

export type ResearchCategory =
  | 'Location'
  | 'Character'
  | 'Lore'
  | 'Reference'
  | 'Dialogue';

export interface ResearchNote {
  id: string;
  category: ResearchCategory;
  title: string;
  content: string;
  updatedAt: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  arc: string;
  traits: string;
}

export type GenreType =
  | 'Feature Film'
  | 'Short Film'
  | 'Thriller / Mystery'
  | 'Romance / Drama'
  | 'Sci-Fi / Fantasy'
  | 'Action / Adventure'
  | 'Comedy'
  | 'Horror';

export interface ScriptProject {
  id: string;
  title: string;
  author: string;
  genre: GenreType;
  logline: string;
  elements: ScriptElement[];
  beats: BeatItem[];
  research: ResearchNote[];
  characters: CharacterProfile[];
  updatedAt: string;
}

export type ThemeMode = 'paper' | 'light' | 'cinema';
