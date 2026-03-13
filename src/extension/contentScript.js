// Content Script for Hinglish Translator Extension

let floatingButton = null;
let selectedText = "";
let isEnabled = true;

// Load initial state
chrome.storage.local.get(['enabled'], (result) => {
  isEnabled = result.enabled !== false;
});

// Listen for changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (!isEnabled) removeFloatingButton();
  }
});

document.addEventListener('mouseup', (e) => {
  if (!isEnabled) return;
  
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0) {
    selectedText = text;
    showFloatingButton(e.clientX, e.clientY);
  } else {
    removeFloatingButton();
  }
});

function showFloatingButton(x, y) {
  removeFloatingButton();

  floatingButton = document.createElement('button');
  floatingButton.id = 'hinglish-translate-btn';
  floatingButton.innerText = 'Translate';
  
  // Basic styling - in real app would use CSS file
  Object.assign(floatingButton.style, {
    position: 'fixed',
    left: `${x}px`,
    top: `${y - 40}px`,
    zIndex: '999999',
    padding: '8px 16px',
    backgroundColor: '#1A1A1A',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  });

  floatingButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      text: selectedText
    }, (response) => {
      if (response && response.success) {
        showTranslationPopup(response.data, x, y);
      }
    });
  });

  document.body.appendChild(floatingButton);
}

function removeFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

function showTranslationPopup(data, x, y) {
  removeFloatingButton();
  
  const popup = document.createElement('div');
  popup.id = 'hinglish-translation-popup';
  // ... similar logic to create the popup UI as seen in the simulator ...
  // For brevity in this file, we'll just log it
  console.log("Translation Result:", data);
  alert(`Casual: ${data.casual}\nProfessional: ${data.professional}`);
}
