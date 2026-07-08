export function useWhatsAppFormat() {
  function formatWhatsAppText(text: string) {
    if (!text) return ''
    
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    return escaped
      .replace(/```(.*?)```/gs, '<pre class="font-mono bg-black/20 p-2 rounded my-1">$1</pre>')
      .replace(/`(.*?)`/g, '<code class="font-mono bg-black/20 px-1 rounded text-[0.9em]">$1</code>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/^&gt; (.*$)/gm, '<blockquote class="border-l-4 border-white/20 pl-3 ml-1 my-1 italic text-on-surface-variant">$1</blockquote>')
  }

  const csvTemplateHeaders = [
    { name: 'Name', required: false, description: 'Nome del contatto (opzionale)' },
    { name: 'Prefix', required: false, description: 'Prefisso internazionale es. 39 (default: 39 se assente)' },
    { name: 'Phone', required: true, description: 'Numero di telefono senza prefisso' },
    { name: 'Email', required: false, description: 'Indirizzo email (opzionale)' },
    { name: 'Company', required: false, description: 'Nome azienda (opzionale)' },
  ]

  return {
    formatWhatsAppText,
    csvTemplateHeaders
  }
}
