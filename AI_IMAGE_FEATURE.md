# AI Image Node Generator Feature

## Overview

The AI Image Node Generator is a powerful feature that allows you to automatically create knowledge nodes from images using Google's Gemini AI. Simply drag and drop images or select them from your file system, and the AI will analyze each image to generate:

- **Title**: A concise, descriptive title for the node
- **Content**: A detailed description of what's in the image
- **Tags**: Relevant tags that categorize the content (max 10 tags)

## How to Use

### 1. Setup Gemini API Key

1. Click the "+++" button in the sidebar (appears when a cluster is selected)
2. Click the settings gear icon (⚙️) in the modal
3. Enter your Gemini API key
4. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Generate Nodes from Images

1. Select a cluster in the sidebar
2. Click the "+++" button (AI Image Node Generator)
3. Drag and drop images into the drop zone, or click "Select Images" to browse
4. Wait for the AI to process each image
5. Review the generated titles, content, and tags
6. Click "Generate Nodes" to create the nodes

## Features

- **Drag & Drop Interface**: Easy-to-use drag and drop for multiple images
- **AI-Powered Analysis**: Uses Gemini Vision API for intelligent image analysis
- **Context-Aware**: Considers existing cluster content and tags for consistency
- **Batch Processing**: Process multiple images at once
- **Error Handling**: Retry failed processing attempts
- **Progress Tracking**: Real-time status updates for each image

## Technical Details

### API Integration

- Uses Google Gemini Pro Vision API
- Images are converted to base64 for API transmission
- API key is stored locally in localStorage

### Content Generation

- **Title**: Max 50 characters, descriptive and concise
- **Content**: 100-200 words, detailed description with context
- **Tags**: 3-10 tags, consistent with existing cluster tags

### Error Handling

- Network errors are caught and displayed
- Invalid API responses are handled gracefully
- Fallback content is provided if AI analysis fails

## Requirements

- Valid Gemini API key from Google AI Studio
- Selected cluster (required for node creation)
- Internet connection for API calls

## Privacy & Security

- API key is stored locally in your browser
- Images are sent to Google's servers for analysis
- No images or data are stored permanently on external servers
- API key is never shared or transmitted to third parties

## Troubleshooting

### Common Issues

1. **"API key not configured"**

   - Set up your Gemini API key in the settings

2. **"API request failed"**

   - Check your internet connection
   - Verify your API key is valid
   - Ensure you have sufficient API quota

3. **"No response generated"**

   - Try again with a different image
   - Check if the image format is supported (JPEG, PNG, etc.)

4. **Generated content seems off**
   - The AI analyzes images based on visual content
   - Complex or abstract images may produce unexpected results
   - You can always edit the generated content after creation

### Supported Image Formats

- JPEG/JPG
- PNG
- WebP
- GIF (first frame only)

### File Size Limits

- Maximum file size: 4MB per image
- Recommended resolution: 1024x1024 pixels or lower for faster processing
