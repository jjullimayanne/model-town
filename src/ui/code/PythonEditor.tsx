import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';

const cozyTheme = EditorView.theme({
  '&': { backgroundColor: '#fffdf6', fontSize: '13.5px', borderRadius: '16px' },
  '.cm-gutters': { backgroundColor: '#f6ecd6', color: '#b39478', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#fff3d6' },
  '.cm-activeLineGutter': { backgroundColor: '#f3e2bd' },
  '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
});

export function PythonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-2xl overflow-hidden border-3 border-bark/15">
      <CodeMirror value={value} onChange={onChange} extensions={[python(), cozyTheme]} height="360px" basicSetup={{ foldGutter: false }} />
    </div>
  );
}

export function Console({ lines }: { lines: { text: string; kind?: 'err' | 'ok' | 'dim' }[] }) {
  if (!lines.length) return null;
  return (
    <div className="rounded-2xl bg-[#0d0a1f] text-[#e8defc] font-mono text-[13px] p-3 space-y-0.5 max-h-40 overflow-auto scroll-soft">
      {lines.map((l, i) => (
        <div key={i} className={l.kind === 'err' ? 'text-[#ff9f8f]' : l.kind === 'ok' ? 'text-[#b8f0a0]' : l.kind === 'dim' ? 'opacity-60' : ''}>{l.text}</div>
      ))}
    </div>
  );
}
