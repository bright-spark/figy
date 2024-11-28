declare global {
  const figma: {
    showUI(__html__: string, arg1: { width: number; height: number }): unknown;
    createFrame(): unknown;
    viewport: any;
    loadFontAsync(arg0: { family: string; style: string }): unknown;
    createRectangle: () => RectangleNode;
    createText: () => TextNode;
    notify: (message: string, options?: { error?: boolean }) => void;
    currentPage: {
      selection: readonly SceneNode[];
      appendChild: (node: SceneNode) => void;
    };
    ui: {
      onmessage: (callback: (msg: any) => void) => void;
      postMessage: (msg: any) => void;
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

  type Paint = {
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
  };
}

export {};
