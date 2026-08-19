// Public-provider privacy guard.
//
// The consumer app may describe available clinic coverage, but it must never
// expose a provider phone/address or let a visitor bypass HELP 911. Provider
// contact details can remain available to authenticated internal workflows;
// this guard only scrubs the public clinic cards rendered by App.jsx.

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
const ADDRESS_RE = /\b\d{2,6}\s+[A-Za-z0-9.'\- ]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Highway|Hwy|Court|Ct|Circle|Cir|Parkway|Pkwy)\b[^\n,]*(?:,?\s*(?:Suite|Ste|#)\s*[A-Za-z0-9-]+)?(?:,?\s*[A-Za-z .'-]+)?\s+GA\s+\d{5}\b/gi;

function looksLikeProviderCard(element) {
  if (!(element instanceof HTMLElement)) return false;
  const text = element.textContent || '';
  return text.includes('Book Visit') && text.includes('Ride') &&
    (text.includes('Chiro') || text.includes('Accident Doctor') || text.includes('Diagnostics'));
}

function findProviderCard(start) {
  let element = start instanceof HTMLElement ? start : start?.parentElement;
  for (let depth = 0; element && depth < 8; depth += 1, element = element.parentElement) {
    if (looksLikeProviderCard(element)) return element;
  }
  return null;
}

function scrubTextNode(node) {
  const card = findProviderCard(node.parentElement);
  if (!card) return;

  const original = node.nodeValue || '';
  let next = original
    .replace(ADDRESS_RE, 'Location coordinated by HELP 911')
    .replace(PHONE_RE, 'Contact routed through HELP 911');

  // The clinic card's direct CTA must also communicate the routing rule.
  if (/^\s*📞?\s*Call\s*$/i.test(next)) next = 'HELP 911';
  if (next !== original) node.nodeValue = next;
}

function scrubProviderCards(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(scrubTextNode);
}

function routeThroughHelp911(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const clickable = target.closest('a,button,[role="button"]');
  if (!clickable) return;
  const card = findProviderCard(clickable);
  if (!card) return;

  const href = clickable.getAttribute?.('href') || '';
  const label = (clickable.textContent || '').trim();
  const directProviderAction = href.startsWith('tel:') || /^(?:📞\s*)?(?:Call|HELP 911)$/i.test(label) || /Book Visit/i.test(label);
  if (!directProviderAction) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  window.location.assign('/request-help?source=clinic_directory&intent=provider_routing');
}

export function initProviderPrivacy() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const run = () => scrubProviderCards(document.body);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  document.addEventListener('click', routeThroughHelp911, true);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) scrubTextNode(node);
        else if (node instanceof HTMLElement) scrubProviderCards(node);
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
}
