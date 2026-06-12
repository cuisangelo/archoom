import CodeMirror from '@uiw/react-codemirror';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

interface LangState {
  inBrackets: boolean;
}

const archoomLang = StreamLanguage.define<LangState>({
  startState: () => ({ inBrackets: false }),
  token(stream, state) {
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return 'string';
    if (stream.eatSpace()) return null;
    if (!state.inBrackets && stream.match(/^(direction|colorMode|styleMode|typeface|title|note)(?=\s)/)) {
      return 'keyword';
    }
    if (stream.match(/^(<>|-->|>|<)/) || stream.match(/^--?(?=\s)/)) return 'operator';
    const ch = stream.peek();
    if (ch === '[') {
      state.inBrackets = true;
      stream.next();
      return 'bracket';
    }
    if (ch === ']') {
      state.inBrackets = false;
      stream.next();
      return 'bracket';
    }
    if (ch === '{' || ch === '}') {
      stream.next();
      return 'bracket';
    }
    if (ch === ':' || ch === ',') {
      stream.next();
      return 'punctuation';
    }
    if (state.inBrackets && stream.match(/^[\w-]+(?=\s*:)/)) return 'propertyName';
    if (stream.match(/^[\w./#-]+/)) return state.inBrackets ? 'atom' : null;
    stream.next();
    return null;
  },
});

const highlight = HighlightStyle.define([
  { tag: t.comment, color: '#9CA3AF' },
  { tag: t.string, color: '#3D5A80' },
  { tag: t.keyword, color: '#2B2F3A', fontWeight: '600' },
  { tag: t.operator, color: '#9A4A42', fontWeight: '600' },
  { tag: t.bracket, color: '#8A93A3' },
  { tag: t.punctuation, color: '#8A93A3' },
  { tag: t.propertyName, color: '#5F4B8B' },
  { tag: t.atom, color: '#3A6E6A' },
]);

const editorTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', fontSize: '13px', height: '100%' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
  '.cm-content': { padding: '14px 0' },
  '.cm-line': { padding: '0 14px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#C2C7D1',
    border: 'none',
    paddingLeft: '8px',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#6B7280' },
  '.cm-activeLine': { backgroundColor: 'rgba(246,247,248,0.7)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#E7EDF6' },
  '.cm-cursor': { borderLeftColor: '#1F2430' },
});

const extensions = [archoomLang, syntaxHighlighting(highlight), editorTheme, EditorView.lineWrapping];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      className="h-full"
      extensions={extensions}
      basicSetup={{ foldGutter: false, autocompletion: false, highlightSelectionMatches: false }}
    />
  );
}
