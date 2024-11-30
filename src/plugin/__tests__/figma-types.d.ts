declare global {
  const figma: FigmaPluginAPI & {
    createFrame(): unknown;
    viewport: Viewport;
    loadFontAsync(arg0: { family: string; style: string }): unknown;
    createRectangle: () => RectangleNode;
    createText: () => TextNode;
    notify: (message: string, options?: { error?: boolean }) => void;
    currentPage: {
      selection: readonly SceneNode[];
      appendChild: (node: SceneNode) => void;
    };
    root: {
      getPluginData: (key: string) => string;
      setPluginData: (key: string, value: string) => void;
    };
  };

  interface SceneNode {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    locked: boolean;
    remove: () => void;
  }

  interface RectangleNode extends SceneNode {
    type: 'RECTANGLE';
    resize: (width: number, height: number) => void;
    fills: Paint[];
    cornerRadius: number;
    strokeWeight: number;
    strokes: Paint[];
  }

  interface TextNode extends SceneNode {
    type: 'TEXT';
    resize: (width: number, height: number) => void;
    characters: string;
    fontSize: number;
    textAlignHorizontal: string;
    textAlignVertical: string;
    fills: Paint[];
  }

  interface Viewport {
    center: { x: number; y: number };
    zoom: number;
  }

  type Paint = {
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
  };

  interface ShowUIOptions {
    width?: number;
    height?: number;
    visible?: boolean;
  }

  interface UIEventHandler {
    postMessage: (pluginMessage: Record<string, unknown>) => void;
  }

  interface FigmaUI {
    onmessage: ((msg: Record<string, unknown>) => void) | null;
    postMessage: (pluginMessage: Record<string, unknown>) => void;
  }

  interface FigmaPluginAPI {
    ui: UIEventHandler;
    showUI: (html: string, options?: ShowUIOptions) => void;
  }
}

export {};
