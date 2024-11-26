export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export class ColorUtils {
  static hexToRGB(hex: string): ColorRGB {
    // Remove the hash if present
    hex = hex.replace(/^#/, '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    // Ensure values are between 0 and 255
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Convert to hex and pad with zeros if needed
    const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return `#${hex}`;
  }

  static rgbToFigmaColor(color: ColorRGB): RGB {
    return {
      r: color.r / 255,
      g: color.g / 255,
      b: color.b / 255
    };
  }

  static figmaColorToRGB(color: RGB): ColorRGB {
    return {
      r: Math.round(color.r * 255),
      g: Math.round(color.g * 255),
      b: Math.round(color.b * 255)
    };
  }
}
