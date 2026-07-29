import React, { useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Paperclip, Send } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onSendFile, onTyping, disabled }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setText(value);
    onTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1500);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSendFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="composer" style={{ position: 'relative', flexShrink: 0 }}>
      {showEmoji && (
        <div style={{ position: 'absolute', bottom: 60, left: 12, zIndex: 20 }}>
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              handleChange(text + emojiData.emoji);
            }}
          />
        </div>
      )}

      <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowEmoji((v) => !v)} title="Émojis">
        <Smile size={20} />
      </button>

      <button type="button" className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()} title="Joindre un fichier">
        <Paperclip size={20} />
      </button>
      <input ref={fileInputRef} type="file" hidden onChange={handleFile} />

      <input
        className="field"
        placeholder="Écrivez un message…"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={handleSend}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        disabled={disabled || !hasText}
        aria-label="Envoyer"
        style={{
          width: 42,
          height: 42,
          minWidth: 42,
          borderRadius: 999,
          border: 'none',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: hasText ? 'pointer' : 'default',
          background: hasText
            ? 'linear-gradient(135deg, var(--violet), var(--pink))'
            : 'var(--bg-sunken)',
          color: hasText ? '#fff' : 'var(--text-muted)',
          boxShadow: hasText ? '0 4px 14px rgba(124, 92, 255, 0.4)' : 'none',
          transform: pressed && hasText ? 'scale(0.88)' : 'scale(1)',
          transition: 'transform 0.12s ease, box-shadow 0.15s ease, background 0.2s ease, color 0.2s ease',
        }}
      >
        <Send size={18} style={{ transform: hasText ? 'translateX(1px)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
    </div>
  );
}
