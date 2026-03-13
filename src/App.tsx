/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

declare const chrome: any;
import { Languages, Copy, Check, Replace, X, Loader2, Settings, ExternalLink, Key, Trash2, Save } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['gemini_api_key', 'enabled'], (result: any) => {
        if (result.gemini_api_key) setApiKey(result.gemini_api_key);
        if (result.enabled !== undefined) setEnabled(result.enabled);
      });
    }
  }, []);

  const saveSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 
        gemini_api_key: apiKey,
        enabled: enabled
      }, () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      });
    }
  };

  const deleteApiKey = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove('gemini_api_key', () => {
        setApiKey('');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      });
    }
  };

  return (
    <div className="w-[350px] p-6 bg-[#fbfbf9] font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#5A5A40] p-2 rounded-xl">
          <Languages className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-serif font-bold text-[#1a1a1a]">Hinglish AI</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Extension Settings</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Toggles */}
        <div className="p-4 bg-white rounded-2xl border border-black/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">Enable Extension</p>
              <p className="text-[10px] opacity-50">Turn translation features on/off</p>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-[#5A5A40]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">
              Gemini API Key
            </label>
            {apiKey && (
              <button 
                onClick={deleteApiKey}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={10} />
                Delete Key
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini key here..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#f5f5f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
            />
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          </div>
          <p className="mt-2 text-[10px] opacity-50 leading-relaxed">
            Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-[#5A5A40]">Google AI Studio</a>.
          </p>
        </div>

        <button
          onClick={saveSettings}
          className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]"
        >
          {isSaved ? (
            <>
              <Check size={16} className="text-emerald-400" />
              Settings Saved
            </>
          ) : (
            <>
              <Save size={16} />
              Save Configuration
            </>
          )}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-black/5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] mb-3">How to use</h3>
        <ul className="space-y-2 text-xs opacity-70">
          <li className="flex gap-2">
            <span className="font-bold text-[#5A5A40]">1.</span>
            Type in Hinglish in any text box (e.g. Gmail, WhatsApp).
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#5A5A40]">2.</span>
            Wait for 1.5s to see the live English suggestion.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#5A5A40]">3.</span>
            Press TAB to apply the translation.
          </li>
        </ul>
      </div>
    </div>
  );
}
