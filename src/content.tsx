import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2 } from 'lucide-react';

declare const chrome: any;

const ContentApp = () => {
  // Live Typing States
  const [activeInput, setActiveInput] = useState<HTMLElement | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSuggestion, setLiveSuggestion] = useState<string | null>(null);
  const liveSuggestionRef = useRef<string | null>(null);
  const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, isAbove: false });
  const [settings, setSettings] = useState({ enabled: true });
  
  // Flag to ignore input events triggered by our own translation application
  const ignoreNextInputRef = useRef(false);

  useEffect(() => {
    liveSuggestionRef.current = liveSuggestion;
  }, [liveSuggestion]);

  useEffect(() => {
    const loadSettings = () => {
      chrome.storage.local.get(['enabled'], (res: any) => {
        setSettings({
          enabled: res.enabled !== undefined ? res.enabled : true
        });
      });
    };

    loadSettings();
    chrome.storage.onChanged.addListener(loadSettings);
    return () => chrome.storage.onChanged.removeListener(loadSettings);
  }, []);

  useEffect(() => {
    if (!settings.enabled) return;

    const handleSelectionChange = () => {
      if (ignoreNextInputRef.current) return;

      const selection = window.getSelection();
      const activeEl = document.activeElement as HTMLElement;
      
      let text = '';
      let rect: DOMRect | null = null;
      let currentInput: HTMLElement | null = null;

      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        const input = activeEl as HTMLInputElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        if (start !== end) {
          text = input.value.substring(start, end);
          rect = input.getBoundingClientRect();
          currentInput = input;
        }
      } else if (activeEl && activeEl.closest('[contenteditable="true"], [contenteditable=""], [role="textbox"]')) {
        const ce = activeEl.closest('[contenteditable="true"], [contenteditable=""], [role="textbox"]') as HTMLElement;
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (ce.contains(range.commonAncestorContainer) && selection.toString().trim().length > 0) {
            text = selection.toString();
            const rects = range.getClientRects();
            rect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
            currentInput = ce;
          }
        }
      }

      if (text.trim().length > 0) {
        setSelectedText(text.trim());
        setActiveInput(currentInput);
        if (rect) {
          updateOverlayPosition(rect);
        }
      } else {
        setSelectedText('');
        setLiveSuggestion(null);
        setLiveLoading(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && liveSuggestionRef.current && activeInput) {
        const text = liveSuggestionRef.current;
        if (text.startsWith("Error:") || text.includes("Quota")) {
          return; // Don't apply errors as text
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        activeInput.focus();

        ignoreNextInputRef.current = true;

        if (activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA') {
          const input = activeInput as HTMLInputElement;
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const originalValue = input.value;
          const newValue = originalValue.substring(0, start) + text + originalValue.substring(end);

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

          if (activeInput.tagName === 'INPUT' && nativeInputValueSetter) {
            nativeInputValueSetter.call(input, newValue);
          } else if (activeInput.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(input, newValue);
          } else {
            input.value = newValue;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Restore cursor position after the inserted text
          const newCursorPos = start + text.length;
          input.setSelectionRange(newCursorPos, newCursorPos);
        } else {
          document.execCommand('insertText', false, text);
        }

        setLiveSuggestion(null);
        setSelectedText('');
        
        setTimeout(() => {
          ignoreNextInputRef.current = false;
        }, 100);
      }
    };

    const updateOverlayPosition = (rect: DOMRect) => {
      let top = rect.bottom + 8;
      let left = rect.left + (rect.width / 2) - 50;
      let isAbove = false;

      if (top > window.innerHeight - 60) {
        top = rect.top - 45;
        isAbove = true;
      }
      
      if (top < 10) top = 10;
      if (left < 10) left = 10;
      if (left > window.innerWidth - 300) left = window.innerWidth - 300;

      setOverlayPos({
        top,
        left,
        isAbove
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [settings.enabled, activeInput]);

  // Live Translation Debounce
  useEffect(() => {
    if (!settings.enabled) return;
    if (!selectedText.trim() || selectedText.length < 2) return;

    const timer = setTimeout(async () => {
      setLiveLoading(true);
      try {
        const storage = await new Promise<any>((resolve) => {
          chrome.storage.local.get(['gemini_api_key'], resolve);
        });
        const key = storage.gemini_api_key;
        if (!key) {
          setLiveLoading(false);
          return;
        }

        chrome.runtime.sendMessage({
          type: 'TRANSLATE_LIVE',
          text: selectedText,
          apiKey: key
        }, (response: any) => {
          if (chrome.runtime.lastError) {
            console.error("Extension Error:", chrome.runtime.lastError);
            setLiveLoading(false);
            return;
          }
          if (response && response.text) {
            if (response.text.startsWith("Error:") || response.text.includes("Quota exceeded")) {
              setLiveSuggestion(response.text);
            } else if (response.text.trim() !== selectedText.trim()) {
              setLiveSuggestion(response.text.trim());
            }
          }
          setLiveLoading(false);
        });
      } catch (error) {
        setLiveLoading(false);
      }
    }, 1200); // Increased delay to 1200ms to save API quota

    return () => clearTimeout(timer);
  }, [selectedText, settings.enabled]);

  const handleApplyTranslation = (text: string) => {
    if (!activeInput) return;

    activeInput.focus();
    ignoreNextInputRef.current = true;

    if (activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA') {
      const input = activeInput as HTMLInputElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const originalValue = input.value;
      const newValue = originalValue.substring(0, start) + text + originalValue.substring(end);

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

      if (activeInput.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(input, newValue);
      } else if (activeInput.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(input, newValue);
      } else {
        input.value = newValue;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      const newCursorPos = start + text.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      document.execCommand('insertText', false, text);
    }
    
    setLiveSuggestion(null);
    setSelectedText('');
    
    setTimeout(() => {
      ignoreNextInputRef.current = false;
    }, 100);
  };

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: 2147483647, pointerEvents: 'none' }}>
      {/* Active Indicator */}
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', opacity: 0.2, fontSize: '10px', color: '#5A5A40', pointerEvents: 'none' }}>
        Hinglish AI Active
      </div>

      {/* Live Translating Status */}
      {liveLoading && !liveSuggestion && (
        <div
          style={{
            position: 'absolute',
            top: overlayPos.top,
            left: Math.max(10, overlayPos.left),
            transform: overlayPos.isAbove ? 'translateY(-100%)' : 'none',
            backgroundColor: '#1a1a1a',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 2147483647
          }}
        >
          <Loader2 size={10} className="animate-spin" />
          Translating selection...
        </div>
      )}

      {/* Live Suggestion Badge */}
      {liveSuggestion && (
        <div
          style={{
            position: 'absolute',
            top: overlayPos.top,
            left: overlayPos.left,
            transform: overlayPos.isAbove ? 'translateY(-100%)' : 'none',
            backgroundColor: liveSuggestion.startsWith("Error:") || liveSuggestion.includes("Quota") ? '#ef4444' : '#10b981',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2147483647,
            cursor: 'pointer',
            pointerEvents: 'auto',
            maxWidth: '400px',
            maxHeight: '200px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4'
          }}
          onClick={() => {
            if (!liveSuggestion.startsWith("Error:") && !liveSuggestion.includes("Quota")) {
              handleApplyTranslation(liveSuggestion);
            } else {
              setLiveSuggestion(null);
            }
          }}
        >
          {!liveSuggestion.startsWith("Error:") && !liveSuggestion.includes("Quota") && (
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginTop: '2px', flexShrink: 0 }}>TAB</span>
          )}
          <span style={{ wordBreak: 'break-word' }}>{liveSuggestion}</span>
        </div>
      )}
    </div>
  );
};

// Inject into page
const inject = () => {
  if (document.getElementById('hinglish-translator-root')) return;
  
  const container = document.createElement('div');
  container.id = 'hinglish-translator-root';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(<ContentApp />);
};

// Watch for DOM changes to re-inject if needed (Gmail SPA navigation)
const observer = new MutationObserver(() => {
  if (!document.getElementById('hinglish-translator-root')) {
    inject();
  }
});

if (document.body) {
  inject();
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    inject();
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
