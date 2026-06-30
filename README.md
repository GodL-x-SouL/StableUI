# StableUI

AI Image Generation Studio powered by [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp). A self-hosted web interface for text-to-image generation, inpainting/editing, and model management.

**Version:** 0.4.0

## Features

### Image Generation
- **Text2Image** — Full-featured text-to-image with live preview, batch generation, prompt presets, and negative prompts
- **Edit (Inpainting)** — Canvas-based inpainting with brush/pan/zoom, mask drawing, and adjustable strength
- **Gallery** — Browse, view, download, delete, and send generated images back to Text2Image or Edit

### Model Management
- **Model Hub** — One-click downloads for preset model packs:
  - SD 1.x / 2.x, SDXL, SD3/SD3.5
  - Krea 2 (8-step distilled)
  - FLUX.2 Klein 9B (4-step distilled)
  - Z-Image (8-step distilled)
  - Qwen Image
  - Ideogram4
- **Custom Models** — Download any model from HuggingFace, CivitAI, or ModelScope via URL
- **Download Manager** — Track active downloads with pause, resume, and cancel support
- **Gated Model Tokens** — Configure HuggingFace, CivitAI, and ModelScope authentication tokens

### Configuration
- **Configurable Sidebar** — All generation parameters exposed in a collapsible settings panel
- **Preset System** — Save/load named configuration presets with built-in model-specific defaults
- **Configurable Paths** — Set custom backend, models, and output directories

### Backend Management
- **Setup Wizard** — First-run guided setup for runtime binary and model downloads
- **Binary Management** — Download stable-diffusion.cpp releases directly, or use a custom binary
- **Runtime Status** — Live backend status indicator (online/offline/invalid)
- **Floating Logs** — Real-time server log viewer

### Network & Access
- **Local Network Sharing** — Access from other devices on your LAN
- **Ngrok Tunnels** — Expose via ngrok with `--ngrok` flag
- **Cloudflare Tunnels** — Expose via Cloudflare with `--cloudflare` flag
- **Docker Support** — Dockerfile included for containerized deployment

### UI
- Dark and light theme with system preference detection
- Responsive layout with mobile navigation
- Route transitions and animations via VueUse Motion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS v4 |
| UI Components | Radix Vue, Lucide Icons, class-variance-authority |
| Backend | Express 5, WebSocket (ws), SSE |
| Build | Vite 7, esbuild |
| Engine | stable-diffusion.cpp (`sd-cli`, `sd-server`) |

## Prerequisites

- **Node.js** 18+
- **stable-diffusion.cpp binaries** — `sd-cli` and `sd-server` placed in `backend/custom/` or downloaded via the Setup Wizard

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Runs the Express server and Vite dev server concurrently:

```bash
npm run dev
```

- Vite dev server: `http://localhost:5173`
- Express API server: `http://localhost:3000` (proxied via Vite)

### Build

```bash
npm run build
```

Produces:
- `dist/` — Vite client build
- `out/server/index.cjs` — Bundled Express server

### Production

```bash
npm start
```

Serves the built client from the Express server on port 3000.

### Docker

```bash
docker build -t stableui .
docker run -p 3000:3000 stableui
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server + Vite dev server concurrently |
| `npm run dev:server` | Build and start the Express server only |
| `npm run dev:client` | Start the Vite dev server only |
| `npm run build` | Build both client and server |
| `npm run build:client` | Build client only (Vite) |
| `npm run build:server` | Build server only (esbuild) |
| `npm start` | Run the production server |
| `npm run preview` | Build and run production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## CLI Flags

The Express server accepts these flags:

| Flag | Description |
|------|-------------|
| `--port <number>` | Server port (default: 3000) |
| `--host <address>` | Bind address (default: 0.0.0.0) |
| `--local` | Enable local network sharing |
| `--ngrok` | Start ngrok tunnel (requires `NGROK_AUTHTOKEN` env) |
| `--cloudflare` | Start Cloudflare tunnel |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STABLE_RESOURCES_PATH` | Override root resources path |
| `STABLE_PACKAGED` | Set to `1` for packaged mode |
| `MODEL_PATH` | Override models directory |
| `OUTPUT_PATH` | Override output directory |
| `CACHE_PATH` | Override cache directory |
| `LOG_PATH` | Override log directory |
| `CONFIG_PATH` | Override config directory |
| `STABLE_BACKEND_CONFIG_PATH` | Override backend config file path |
| `SD_SERVER_URL` | SD server URL (default: http://localhost:1234) |
| `NGROK_AUTHTOKEN` | Ngrok authentication token |
| `PORT` | Fallback server port |

## Project Structure

```
StableUI/
├── src/
│   ├── renderer/                  # Vue 3 frontend
│   │   └── src/
│   │       ├── views/             # Page components
│   │       │   ├── Text2Image.vue # Text-to-image generation
│   │       │   ├── Edit.vue       # Inpainting editor
│   │       │   ├── Gallery.vue    # Generated image gallery
│   │       │   └── Settings.vue   # App settings
│   │       ├── components/        # Reusable components
│   │       │   ├── layout/        # Titlebar, ConfigPanel, MobileNav
│   │       │   ├── ui/            # Select, Tooltip primitives
│   │       │   ├── ModelHubModal.vue
│   │       │   ├── DownloadManagerModal.vue
│   │       │   ├── SetupWizard.vue
│   │       │   └── ...
│   │       ├── composables/       # Vue composables
│   │       ├── stores/            # Pinia stores (config, presets)
│   │       ├── services/          # API client
│   │       ├── lib/               # Utilities, starter packs, motion
│   │       ├── assets/            # CSS
│   │       ├── App.vue            # Root component with router
│   │       └── main.ts            # App entry, router setup
│   └── server/                    # Express backend
│       ├── routes/
│       │   ├── core.ts            # Models, gallery, status, GPU info
│       │   ├── generation.ts      # Image generation (sd-cli)
│       │   ├── media.ts           # Image metadata, file serving
│       │   ├── backend.ts         # Release management, binary config
│       │   ├── network.ts         # Ngrok, Cloudflare, local sharing
│       │   └── setup.ts           # First-run state, app config
│       ├── sd.ts                  # sd-cli/sd-server binary helpers
│       ├── utils.ts               # Download, file, process utilities
│       ├── context.ts             # App context, paths, config loading
│       ├── types.ts               # TypeScript interfaces
│       └── index.ts               # Server entry, Express + WebSocket
├── backend/
│   ├── custom/                    # User-provided binaries
│   └── releases/                  # Downloaded releases
├── models/                        # Downloaded model files
├── output/                        # Generated images
├── dist/                          # Vite build output
├── out/                           # esbuild server output
├── build-server.cjs               # Server build script
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # Base TypeScript config
├── tsconfig.web.json              # Frontend TS config
├── tsconfig.node.json             # Server TS config
└── Dockerfile
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Backend and runtime status |
| `/api/health` | GET | Health check |
| `/api/models` | GET | List available models |
| `/api/models/download` | POST | Download a model |
| `/api/generate-cli` | POST | Generate image via sd-cli |
| `/api/cancel-cli` | POST | Cancel running generation |
| `/api/gallery` | GET | List generated images |
| `/api/gallery/*` | DELETE | Delete an image |
| `/api/backend/releases` | GET | List sd.cpp releases |
| `/api/backend/config` | GET | Get backend config |
| `/api/backend/activate` | POST | Set active backend version |
| `/api/paths` | GET/POST | Get/set custom paths |
| `/api/downloads` | GET | List active downloads |
| `/api/downloads/:id/cancel` | POST | Cancel a download |
| `/api/downloads/:id/pause` | POST | Pause a download |
| `/api/downloads/:id/resume` | POST | Resume a download |
| `/api/setup` | GET | Get first-run state |
| `/api/setup/complete` | POST | Mark setup complete |
| `/api/network/status` | GET | Network sharing status |
| `/api/config` | GET/POST | App configuration |

## License

See the [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) project for the underlying engine license.

## Credits

- **stable-diffusion.cpp** by [leejet](https://github.com/leejet) — The underlying image generation engine powering this project
- **FlaxeoUI** by [fabricio3g](https://github.com/fabricio3g) — Original inspiration for the UI design
