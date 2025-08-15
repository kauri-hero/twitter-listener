/**
 * Structured logger with beautiful colors for CLI output
 */

// ANSI Color codes
const colors = {
  // Reset
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
} as const;

export interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export class Logger {
  private prefix: string;
  private showTimestamp: boolean;
  private useColors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.showTimestamp = options.timestamp || false;
    // Auto-detect color support: disabled in CI or when piping to file
    this.useColors = options.colors !== false && this.shouldUseColors();
  }

  private shouldUseColors(): boolean {
    // Disable colors in CI environments or when output is redirected
    if (process.env.CI || process.env.NO_COLOR || !process.stdout.isTTY) {
      return false;
    }
    
    // Check if we're in a color-capable terminal
    const term = process.env.TERM || '';
    return term !== 'dumb' && term.includes('color');
  }

  private colorize(text: string, color: string): string {
    if (!this.useColors) return text;
    return `${color}${text}${colors.reset}`;
  }

  private formatMessage(level: string, icon: string, message: string, details?: any, levelColor: string = colors.white): string {
    const timestamp = this.showTimestamp ? 
      this.colorize(`[${new Date().toISOString()}]`, colors.gray) + ' ' : '';
    
    const prefix = this.prefix ? 
      this.colorize(this.prefix, colors.cyan) + ' ' : '';
    
    const coloredIcon = this.colorize(icon, levelColor);
    const coloredMessage = this.colorize(message, levelColor);
    
    let output = `${timestamp}${prefix}${coloredIcon} ${coloredMessage}`;
    
    if (details) {
      if (typeof details === 'string') {
        output += ` ${this.colorize(details, colors.gray)}`;
      } else {
        const jsonStr = JSON.stringify(details, null, 2);
        output += `\n${this.colorize(jsonStr, colors.gray)}`;
      }
    }
    
    return output;
  }

  info(message: string, details?: any): void {
    console.log(this.formatMessage('INFO', 'ℹ️', message, details, colors.blue));
  }

  success(message: string, details?: any): void {
    console.log(this.formatMessage('SUCCESS', '✅', message, details, colors.brightGreen));
  }

  warning(message: string, details?: any): void {
    console.warn(this.formatMessage('WARNING', '⚠️', message, details, colors.brightYellow));
  }

  error(message: string, details?: any): void {
    console.error(this.formatMessage('ERROR', '❌', message, details, colors.brightRed));
  }

  debug(message: string, details?: any): void {
    if (process.env.DEBUG === 'true') {
      console.log(this.formatMessage('DEBUG', '🐛', message, details, colors.magenta));
    }
  }

  // Specialized logging methods for different operations
  step(step: string, message: string): void {
    const coloredStep = this.colorize(step, colors.brightCyan);
    const coloredMessage = this.colorize(message, colors.brightWhite);
    console.log(`\n${coloredStep} ${coloredMessage}`);
  }

  substep(message: string, details?: string): void {
    const indent = this.colorize('   ▸', colors.gray);
    const coloredMessage = this.colorize(message, colors.white);
    const coloredDetails = details ? this.colorize(`: ${details}`, colors.gray) : '';
    console.log(`${indent} ${coloredMessage}${coloredDetails}`);
  }

  section(title: string): void {
    const separator = '═'.repeat(52);
    const coloredSeparator = this.colorize(separator, colors.brightCyan);
    const coloredTitle = this.colorize(`🚀 ${title}`, colors.brightWhite + colors.bright);
    
    console.log(`\n${coloredSeparator}`);
    console.log(`${coloredTitle}`);
    console.log(`${coloredSeparator}`);
  }

  progress(current: number, total: number, item?: string): void {
    const percentage = Math.round((current / total) * 100);
    const completed = Math.floor(percentage / 5);
    const remaining = 20 - completed;
    
    const progressBar = this.colorize('█'.repeat(completed), colors.brightGreen) + 
                       this.colorize('░'.repeat(remaining), colors.gray);
    
    const percentText = this.colorize(`${percentage}%`, colors.brightCyan);
    const countText = this.colorize(`(${current}/${total})`, colors.gray);
    const itemText = item ? ` ${this.colorize(`(${item})`, colors.gray)}` : '';
    
    console.log(`   [${progressBar}] ${percentText} ${countText}${itemText}`);
  }

  table(data: Array<Record<string, any>>, columns?: string[]): void {
    if (data.length === 0) return;
    
    const cols = columns || Object.keys(data[0]);
    const maxWidths = cols.map(col => 
      Math.max(col.length, ...data.map(row => String(row[col] || '').length))
    );

    // Header
    const header = cols.map((col, i) => 
      this.colorize(col.padEnd(maxWidths[i]), colors.brightCyan + colors.bright)
    ).join(this.colorize(' │ ', colors.gray));
    
    const separator = cols.map((_, i) => 
      this.colorize('─'.repeat(maxWidths[i]), colors.gray)
    ).join(this.colorize('─┼─', colors.gray));

    console.log(`   ${header}`);
    console.log(`   ${separator}`);

    // Rows
    data.forEach(row => {
      const rowStr = cols.map((col, i) => {
        const value = String(row[col] || '').padEnd(maxWidths[i]);
        // Color code certain values
        if (value.includes('✅') || value.includes('📢') || value.includes('📝')) {
          return this.colorize(value, colors.brightGreen);
        } else if (value.includes('❌')) {
          return this.colorize(value, colors.brightRed);
        } else if (value.startsWith('@')) {
          return this.colorize(value, colors.brightBlue);
        } else if (value.includes('"')) {
          return this.colorize(value, colors.gray);
        }
        return this.colorize(value, colors.white);
      }).join(this.colorize(' │ ', colors.gray));
      
      console.log(`   ${rowStr}`);
    });
  }

  summary(stats: Record<string, number | string>): void {
    const summaryTitle = this.colorize('\n📊 Summary:', colors.brightMagenta + colors.bright);
    console.log(summaryTitle);
    
    Object.entries(stats).forEach(([key, value]) => {
      const coloredKey = this.colorize(key, colors.brightWhite);
      const coloredValue = this.colorize(String(value), colors.brightCyan);
      const bullet = this.colorize('▸', colors.gray);
      console.log(`   ${bullet} ${coloredKey}: ${coloredValue}`);
    });
  }

  // Utility methods
  banner(text: string, subtitle?: string): void {
    const width = Math.max(text.length + 4, 60);
    const padding = Math.floor((width - text.length - 2) / 2);
    
    const topBorder = this.colorize('╭' + '─'.repeat(width - 2) + '╮', colors.brightCyan);
    const bottomBorder = this.colorize('╰' + '─'.repeat(width - 2) + '╯', colors.brightCyan);
    
    const titleLine = this.colorize('│', colors.brightCyan) + 
                     ' '.repeat(padding) + 
                     this.colorize(text, colors.brightWhite + colors.bright) + 
                     ' '.repeat(width - text.length - padding - 2) + 
                     this.colorize('│', colors.brightCyan);
    
    console.log('\n' + topBorder);
    console.log(titleLine);
    
    if (subtitle) {
      const subPadding = Math.floor((width - subtitle.length - 2) / 2);
      const subtitleLine = this.colorize('│', colors.brightCyan) + 
                          ' '.repeat(subPadding) + 
                          this.colorize(subtitle, colors.gray) + 
                          ' '.repeat(width - subtitle.length - subPadding - 2) + 
                          this.colorize('│', colors.brightCyan);
      console.log(subtitleLine);
    }
    
    console.log(bottomBorder);
  }

  // Disable colors (useful for CI/testing)
  disableColors(): void {
    this.useColors = false;
  }

  // Enable colors
  enableColors(): void {
    this.useColors = true;
  }

  // Check if colors are enabled
  get colorsEnabled(): boolean {
    return this.useColors;
  }
}
