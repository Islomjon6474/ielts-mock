# IELTS Mock Assessment Platform

A comprehensive platform for practicing IELTS exam with realistic mock tests covering all four modules: Listening, Reading, Writing, and Speaking.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Ant Design 5
- **State Management**: MobX
- **Utilities**: Ramda

## Features

- 🎧 **Listening Module**: Practice with authentic audio materials
- 📖 **Reading Module**: Improve comprehension with real passages
- ✍️ **Writing Module**: Master Task 1 and Task 2
- 💬 **Speaking Module**: Structured practice sessions
- 📊 **Progress Tracking**: Monitor your performance
- 🎨 **Modern UI**: Clean and intuitive interface

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ielts-mock/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   └── providers/        # Context providers
│   └── stores/               # MobX stores
│       ├── RootStore.ts      # Root store
│       ├── AppStore.ts       # Application state
│       └── StoreContext.tsx  # Store context
├── public/                   # Static assets
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## State Management

The application uses MobX for state management with the following stores:

- **AppStore**: Manages application-wide state (current module, test progress, etc.)
- **RootStore**: Root store that combines all stores

Access stores using the `useStore` hook:

```typescript
import { useStore } from '@/stores/StoreContext'

const MyComponent = observer(() => {
  const { appStore } = useStore()
  // Use appStore...
})
```

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Ant Design**: Enterprise-grade UI components
- Configuration ensures both work seamlessly together

## License

MIT
