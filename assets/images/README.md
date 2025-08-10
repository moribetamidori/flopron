# Images

This directory contains static assets for the Neuppy PKM application.

## Structure

```
assets/
├── images/
│   └── cuttie/         # Personal memory images
│       ├── 0.webp      # Coffee place
│       ├── 1.webp      # Dog walk 1
│       ├── 2.webp      # Dog walk 2
│       ├── 3.webp      # Florida sky
│       ├── 4.webp      # Thai food 1
│       ├── 5.webp      # Thai food 2
│       ├── 6.webp      # Garden/dog with weed hat
│       ├── 7.webp      # Orange cat Tangerine
│       ├── 8.webp      # Orange cat Cara
│       ├── 9.webp      # Venus mango
│       ├── 10.webp     # Chilispot
│       ├── 11.webp     # Prato pizza 1
│       ├── 12.webp     # Prato pizza 2
│       └── 13.webp     # Prato tiramisu
└── icons/              # App icons (future)
```

## Usage in Electron

Images are referenced in `src/data.ts` using relative paths:

```typescript
images: ["./assets/images/cuttie/1.webp"];
```

The paths are relative to the `index.html` file location.

## Adding New Images

1. Place images in the appropriate subdirectory
2. Update the data structure in `src/data.ts`
3. Use relative paths starting with `./assets/`
