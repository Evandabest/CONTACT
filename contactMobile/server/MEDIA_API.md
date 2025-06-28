# Media API Documentation

The server now supports receiving and storing camera and audio data from the mobile app's emergency trigger system.

## WebSocket Events

### Audio Data
- **Event**: `audioData`
- **Data**: `{ audioData: string, format: string }`
- **Response**: `transcriptionUpdate` with transcription results
- **Storage**: Temporary processing only (not saved)

### Photo Data
- **Event**: `photoData`
- **Data**: `{ photoData: string, format: string, timestamp: string }`
- **Response**: `photoReceived` with success status
- **Storage**: Saved to `media/photos/` directory

### Video Data
- **Event**: `videoData`
- **Data**: `{ videoData: string, format: string, timestamp: string }`
- **Response**: `videoReceived` with success status
- **Storage**: Saved to `media/videos/` directory

## REST API Endpoints

### List Media Files
```
GET /api/media/photos
GET /api/media/videos
```

**Response**:
```json
{
  "files": [
    {
      "filename": "photo_1234567890.jpeg",
      "size": 1024000,
      "created": "2024-01-01T12:00:00.000Z",
      "modified": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Serve Media Files
```
GET /media/photos/{filename}
GET /media/videos/{filename}
```

**Response**: Binary file with appropriate content type

## File Storage

- **Photos**: `server/media/photos/`
- **Videos**: `server/media/videos/`
- **Format**: Files are saved with timestamp prefix (e.g., `photo_1234567890.jpeg`)

## Size Limits

- **Photos**: 1KB - 10MB
- **Videos**: 10KB - 100MB
- **Audio**: 2KB - 50MB (for transcription)

## Emergency Trigger Flow

1. **Activation**: 3 taps on Sunrise button
2. **Audio Recording**: Starts immediately
3. **Photo Capture**: Takes photo after 1 second
4. **Video Recording**: Starts after 2 seconds
5. **Deactivation**: 3 taps on Sunset button
6. **Data Transmission**: All media sent to server via WebSocket

## Security Notes

- Media files are stored locally on the server
- No authentication required (for development)
- Files are accessible via direct URL
- Consider implementing authentication for production use 