# Architecture Documentation

## Overview

This application follows a clean, modular architecture with clear separation of concerns.

## Directory Structure

```
src/
├── components/           # React UI components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   └── ...              # Feature-specific components
├── constants/           # Application constants and configurations
│   └── index.ts         # Centralized constants (PDF limits, AI config, etc.)
├── hooks/               # Custom React hooks
├── lib/                 # Business logic and AI utilities
│   └── aiPrompts.ts     # AI prompt templates
├── services/            # External service integrations
│   ├── pdfExtractor.ts  # PDF text extraction
│   └── aiModuleExtractor.ts # AI-based module data extraction
├── types/               # TypeScript type definitions
│   └── index.ts         # All domain types (Module, TimeSlot, etc.)
├── utils/               # Utility functions
│   ├── validation.ts    # Input validation
│   ├── helpers.ts       # Data normalization and helpers
│   ├── dateUtils.ts     # Date manipulation
│   └── exportUtils.ts   # Data export utilities
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Design Principles

### 1. Separation of Concerns
- **Components**: Only handle UI rendering and user interaction
- **Services**: Manage external API calls and data processing
- **Utils**: Provide reusable utility functions
- **Types**: Define data structures used throughout the app
- **Constants**: Store configuration values in one place

### 2. Type Safety
- All components and functions are fully typed with TypeScript
- Centralized type definitions prevent duplication
- Strict mode enabled for maximum type safety

### 3. Error Handling
- Global error boundary catches and displays errors gracefully
- Validation utilities ensure data integrity
- Meaningful error messages for users

### 4. Code Reusability
- Shared utilities reduce code duplication
- Custom hooks extract reusable stateful logic
- UI components are modular and composable

### 5. Maintainability
- Constants are centralized for easy updates
- Clear naming conventions
- Comprehensive JSDoc comments
- Logical file organization

## Key Components

### Services Layer
**PDF Extractor** (`services/pdfExtractor.ts`)
- Validates PDF files (magic number check, size limits)
- Extracts text from PDF documents
- Handles errors gracefully

**AI Module Extractor** (`services/aiModuleExtractor.ts`)
- Uses OpenAI GPT-4o to extract structured data
- Validates extracted data against business rules
- Normalizes assessment weights using largest remainder method

### Validation Layer
**Validation Utils** (`utils/validation.ts`)
- PDF file validation
- ECTS and workload range validation
- Assessment weight validation
- API key format validation

**Helper Utils** (`utils/helpers.ts`)
- Data normalization
- Assessment weight balancing
- Unique ID generation

### Constants
**Application Constants** (`constants/index.ts`)
- PDF processing limits
- Module validation rules
- Study planning constraints
- AI configuration
- Learning methods

### Types
**Domain Types** (`types/index.ts`)
- Module, TimeSlot, Assessment
- StudySession
- ExtractedModuleData
- Learning method types

## Data Flow

```
User Input
    ↓
Component (validates & formats)
    ↓
Service (processes & calls API)
    ↓
Utils (validates & normalizes)
    ↓
Component (displays result)
```

## Best Practices

1. **Always use centralized types** - Import from `types/index.ts`
2. **Validate all inputs** - Use functions from `utils/validation.ts`
3. **Use constants** - Never hardcode magic numbers or strings
4. **Handle errors** - Always provide meaningful error messages
5. **Document complex logic** - Add JSDoc comments for non-obvious code

## Testing Strategy

- Unit tests for validation utilities
- Integration tests for services
- Component tests for UI logic
- E2E tests for critical user flows

## Performance Considerations

- Code splitting for large dependencies (PDF.js, OpenAI)
- Lazy loading of components
- Memoization for expensive computations
- Optimized bundle sizes through tree-shaking

## Security

- Input validation prevents injection attacks
- PDF magic number validation prevents file type spoofing
- API keys stored only in localStorage (browser-side)
- No sensitive data in logs or error messages

## Future Improvements

- Add comprehensive test suite
- Implement caching for AI responses
- Add offline support
- Improve accessibility (ARIA labels, keyboard navigation)
- Add internationalization (i18n)
