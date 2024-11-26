# AI UI Converter - Figma Plugin

A Figma plugin that uses AI to convert design images into UI elements.

## Features

- Upload images via drag & drop or file selection
- AI-powered analysis of design images
- Automatic conversion to Figma UI elements
- Support for various UI components (text, buttons, rectangles, etc.)
- Modern, responsive UI with Figma theme integration
- Error handling and user notifications

## Project Structure

```
src/
├── plugin/
│   ├── controller/
│   │   ├── plugin.ts       # Plugin controller
│   │   └── code.ts         # Plugin main entry
│   ├── ui/
│   │   ├── components/     # React components
│   │   ├── styles/         # CSS modules
│   │   ├── ui.html         # HTML template
│   │   └── ui.tsx          # UI entry point
│   └── utils/
│       └── color.ts        # Color utilities
├── services/
│   └── openai-service.ts   # OpenAI integration
└── types/
    ├── plugin.ts          # Plugin types
    ├── ui.ts             # UI types
    └── errors.ts         # Error types
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Figma desktop app

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/figy.git
   cd figy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Add your OpenAI API key to the `.env` file.

4. Start development:
   ```bash
   npm run dev
   ```

5. In Figma desktop app:
   - Go to Plugins
   - Click "Development"
   - Click "Import plugin from manifest"
   - Select the `manifest.json` file

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Plugin Manifest

The plugin configuration is in `manifest.json`:
- Network access is restricted to OpenAI API domains
- Required permissions are specified
- UI dimensions and capabilities are defined

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

GNU General Public License v3.0 - see LICENSE file for details
