declare const chrome: any;

(async () => {
  const src = chrome.runtime.getURL('content.js');
  await import(src);
})();
