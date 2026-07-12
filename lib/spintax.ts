/**
 * Spintax Engine — Anti-Ban Message Randomization
 *
 * Expands spintax syntax to randomize message text:
 *   "{Ciao|Salve|Buongiorno}" → picks one randomly
 *
 * Supports nested spintax:
 *   "{Ciao|Salve}, {come stai|tutto bene}?" → "Salve, tutto bene?"
 *
 * This helps avoid WhatsApp's duplicate-message detection.
 */

/**
 * Expand all spintax patterns in a text string.
 * Pattern: {option1|option2|option3}
 * Nested patterns are supported and resolved from inner to outer.
 *
 * @param text - Input text with spintax patterns
 * @returns Text with one random option chosen for each pattern
 */
export function expandSpintax(text: string): string {
  const pattern = /(\{([^{}]+)\}|\[([^\[\]]+\|[^\[\]]+)\])/g

  let result = text
  let iterations = 0
  const maxIterations = 50 // safety limit for deeply nested spintax

  while (pattern.test(result) && iterations < maxIterations) {
    result = result.replace(/(\{([^{}]+)\}|\[([^\[\]]+\|[^\[\]]+)\])/g, (_match, _full, braceGroup, bracketGroup) => {
      const group = braceGroup || bracketGroup
      const options = group.split('|')
      const randomIndex = Math.floor(Math.random() * options.length)
      return options[randomIndex].trim()
    })
    iterations++
  }

  return result
}

/**
 * Count the number of possible variations in a spintax text.
 * Useful for showing the user how many unique messages can be generated.
 */
export function countVariations(text: string): number {
  const matches = text.match(/(\{([^{}]+)\}|\[([^\[\]]+\|[^\[\]]+)\])/g)
  if (!matches) return 1

  return matches.reduce((total, match) => {
    const options = match.slice(1, -1).split('|')
    return total * options.length
  }, 1)
}

/**
 * Validate that spintax syntax is well-formed (balanced braces, has options).
 */
export function validateSpintax(text: string): { valid: boolean; error?: string } {
  let depth = 0

  for (const char of text) {
    if (char === '{') depth++
    if (char === '}') depth--
    if (depth < 0) {
      return { valid: false, error: 'Closing brace "}" without matching opening brace' }
    }
  }

  if (depth !== 0) {
    return { valid: false, error: 'Unclosed brace "{"' }
  }

  const groups = text.match(/(\{([^{}]+)\}|\[([^\[\]]+\|[^\[\]]+)\])/g)
  if (groups) {
    for (const group of groups) {
      const inner = group.slice(1, -1)
      if (!inner.includes('|')) {
        return { valid: false, error: `Spintax group "${group}" has no alternatives (needs "|")` }
      }
    }
  }

  return { valid: true }
}
