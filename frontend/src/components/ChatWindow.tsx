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

  return (
    <div className="composer" style={{ position: 'relative' }}>
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

      <button type="button" className="btn btn-primary" onClick={handleSend} disabled={disabled || !text.trim()}>
        <Send size={16} />
      </button>
    </div>
  );
      }
