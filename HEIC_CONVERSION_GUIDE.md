# HEIC Image Conversion Guide

This guide explains the automatic HEIC to PNG conversion feature in the PKM application.

## Overview

The PKM application now automatically converts HEIC (High Efficiency Image Container) files to PNG format when they are uploaded. This ensures compatibility with web browsers and proper image display.

## What are HEIC Files?

- **HEIC** (High Efficiency Image Container) is a modern image format used by Apple devices
- **HEIF** (High Efficiency Image Format) is the underlying format
- Common on iOS devices (iPhone/iPad) since iOS 11
- Offers better compression than JPEG while maintaining quality
- **Problem**: Not directly supported by web browsers

## How It Works

### Automatic Detection

- When you drag and drop or select images, the system automatically detects HEIC/HEIF files
- Detection is based on file extension (.heic, .heif)

### Conversion Process

1. **Upload**: User drags/drops or selects HEIC files
2. **Detection**: System identifies HEIC files by extension
3. **Conversion**: HEIC files are converted to PNG in the main process
4. **Storage**: Converted PNG files are saved with new filenames
5. **Display**: Images display properly in the UI

### User Experience

- **Visual Feedback**: Processing status shows during conversion
- **File Naming**: Original filename is preserved but extension changes to .png
- **Quality**: Maximum quality conversion (quality: 1)
- **Fallback**: If conversion fails, original file is saved

## Technical Implementation

### Frontend (AddNodeModal.tsx)

```typescript
// Enhanced file handling with HEIC detection
const isHeic = ext === "heic" || ext === "heif";
if (isHeic) {
  console.log(`Converting HEIC file: ${file.name}`);
}

// UI improvements
- Processing indicator during conversion
- Support message for HEIC files
- Disabled dropzone during processing
```

### Backend (main.ts)

```typescript
// Automatic HEIC conversion
if (originalExt === ".heic" || originalExt === ".heif") {
  const convertedBuffer = await convert({
    buffer: imageData.buffer.slice(...),
    format: "PNG",
    quality: 1
  });

  // Update filename to .png
  finalFilename = `${nameWithoutExt}.png`;
  finalImageData = Buffer.from(convertedBuffer);
}
```

## Supported Formats

### Input Formats

- ✅ **HEIC** (converted to PNG)
- ✅ **HEIF** (converted to PNG)
- ✅ **JPEG** (saved as-is)
- ✅ **PNG** (saved as-is)
- ✅ **GIF** (saved as-is)
- ✅ **WebP** (saved as-is)

### Output Formats

- **PNG** (for converted HEIC/HEIF files)
- **Original format** (for other image types)

## File Naming Convention

### Original Files

- `photo.jpg` → `1672531200000-abc123.jpg`
- `image.png` → `1672531200000-def456.png`

### Converted HEIC Files

- `IMG_1234.heic` → `1672531200000-ghi789.png`
- `photo.heif` → `1672531200000-jkl012.png`

Format: `{timestamp}-{randomId}.{extension}`

## Error Handling

### Conversion Failures

- If HEIC conversion fails, the system falls back to saving the original file
- Error is logged to console but doesn't stop the process
- User is still able to upload other files

### Non-Image Files

- Files that aren't images are automatically skipped
- Warning logged to console
- No error shown to user

## Performance Considerations

### Conversion Speed

- HEIC conversion takes a few seconds per file
- Processing indicator shows during conversion
- Multiple files are processed sequentially (not parallel)

### File Sizes

- PNG files are typically larger than HEIC
- Trade-off: larger file size for better compatibility
- Quality is preserved at maximum level

## User Interface

### Visual Indicators

- **📁** - Ready for upload
- **⏳** - Processing files
- **"Converting HEIC..."** - Specific HEIC conversion message
- **Blue text** - Information about HEIC conversion

### File List

- Shows converted filename (with .png extension)
- Displays only the filename, not the full path
- Remove button to delete uploaded images

## Troubleshooting

### Common Issues

**HEIC files not converting:**

- Check console for error messages
- Ensure heic-convert package is installed
- Verify file is actually HEIC format

**Conversion taking too long:**

- Large HEIC files take longer to process
- Wait for processing indicator to complete
- Check system resources

**Images not displaying:**

- Converted files should display as PNG
- Check if file was saved successfully
- Verify image path resolution

### Debug Information

Check the console for:

```
Converting HEIC file: IMG_1234.heic
Successfully converted IMG_1234.heic to 1672531200000-abc123.png
Saved image: 1672531200000-abc123.png
```

## Benefits

### For Users

- ✅ **Seamless experience** - Just drag and drop any image
- ✅ **No manual conversion** needed
- ✅ **Universal compatibility** - all images display properly
- ✅ **Quality preservation** - no quality loss during conversion

### For Developers

- ✅ **Automatic handling** - no user education needed
- ✅ **Robust fallback** system
- ✅ **Consistent format** handling
- ✅ **Future-proof** solution

## Future Enhancements

Potential improvements:

- **Parallel processing** for faster conversion of multiple files
- **Progress bars** for individual file conversion
- **Batch conversion** optimization
- **Additional format support** (AVIF, etc.)
- **Compression options** for PNG output

## Dependencies

- **heic-convert**: Core conversion library
- **@types/heic-convert**: TypeScript definitions
- **fs**: File system operations
- **path**: File path utilities

The HEIC conversion feature ensures that users can seamlessly upload images from any device without worrying about format compatibility!
