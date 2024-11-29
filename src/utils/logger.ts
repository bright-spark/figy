interface LogTypes {
  info: string;
  error: string;
  warn: string;
}

const logEmoji: LogTypes = {
  info: '💡',
  error: '❌',
  warn: '⚠️'
};

export function log(message: string, type: keyof LogTypes = 'info'): void {
  console.log(`[Figy ${logEmoji[type]}] ${message}`);
}
