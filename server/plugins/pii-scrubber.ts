export default defineNitroPlugin((nitroApp) => {
  // Regex per PII (email, numeri di telefono)
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phoneRegex = /(\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})/g;

  function scrubString(str: string): string {
    return str
      .replace(emailRegex, (match) => {
        const parts = match.split('@');
        if (parts.length === 2) {
          const name = parts[0];
          const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
          return `${maskedName}@${parts[1]}`;
        }
        return '[EMAIL REDACTED]';
      })
      .replace(phoneRegex, (match) => {
        const cleaned = match.replace(/[\s-]/g, '');
        if (cleaned.length >= 8) {
          return cleaned.substring(0, 3) + '*****' + cleaned.substring(cleaned.length - 2);
        }
        return '[PHONE REDACTED]';
      });
  }

  function scrubArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (typeof arg === 'string') {
        return scrubString(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(scrubString(JSON.stringify(arg)));
        } catch {
          return arg;
        }
      }
      return arg;
    });
  }

  // Intercetta i log server per rimuovere PII (Sempre attivo per compliance)
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: any[]) => originalLog(...scrubArgs(args));
  console.error = (...args: any[]) => originalError(...scrubArgs(args));
  console.warn = (...args: any[]) => originalWarn(...scrubArgs(args));
});
