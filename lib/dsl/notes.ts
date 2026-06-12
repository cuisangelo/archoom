import { unquote } from './parser';

const NOTE_LINE = /^\s*note\s+(.+?)\s*:\s*(.*)$/;

function quoteId(id: string): string {
  return /^[\w-]+$/.test(id) ? id : JSON.stringify(id);
}

/** Insert, update or remove a `note <id>: "text"` statement in the DSL source. */
export function upsertNote(source: string, id: string, text: string): string {
  const lines = source.split('\n');
  let found = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = NOTE_LINE.exec(lines[i]);
    if (m && unquote(m[1]) === id) {
      found = i;
      break;
    }
  }

  if (!text.trim()) {
    if (found < 0) return source;
    lines.splice(found, 1);
    return lines.join('\n');
  }

  const statement = `note ${quoteId(id)}: ${JSON.stringify(text)}`;
  if (found >= 0) {
    lines[found] = statement;
  } else {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('');
    lines.push(statement);
  }
  return lines.join('\n');
}
