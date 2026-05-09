// DO NOT LOG -- handles server-returned strings before they touch the DOM
export function stripHtml(str) {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '')
}

// DO NOT LOG -- sanitizes transcript before it enters any Claude prompt.
// Strips null bytes, C0 control chars (preserving tab/LF/CR), and invisible
// Unicode formatting chars exploitable for prompt injection.
export function sanitizeTranscript(str) {
  if (typeof str !== 'string') return str

  const clean = str
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')

  return Array.from(clean).filter(ch => {
    const cp = ch.codePointAt(0)
    return !(
      cp === 0x00AD ||                    // soft hyphen
      (cp >= 0x200B && cp <= 0x200F) ||  // zero-width space, joiners, directional marks
      (cp >= 0x202A && cp <= 0x202E) ||  // LTR/RTL embedding + overrides
      (cp >= 0x2060 && cp <= 0x2064) ||  // invisible separators (word joiner etc.)
      cp === 0xFEFF                       // BOM / zero-width no-break space
    )
  }).join('').trim()
}
