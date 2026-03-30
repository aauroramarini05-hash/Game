# AuryxEditor (Android)

A full Kotlin Android video editor app using MVVM, ExoPlayer preview, and FFmpegKit local processing.

## Tech Stack
- Kotlin
- Min SDK 29
- Target/Compile SDK 34 (Android 14)
- MVVM (ViewModel + Repository)
- Material Design 3
- ExoPlayer (Media3)
- FFmpegKit (`com.arthenica:ffmpeg-kit-full-gpl:6.0-2`)

## Features
- Import videos from gallery/media picker
- Trim video by start/end seconds
- Compress video
- Merge multiple videos
- Export processed video to device storage (MediaStore)
- Processing state and status messages

## Project Structure
- `MainActivity` - Entry point and permission handling
- `EditorActivity` - Editor UI, playback preview, and actions
- `FFmpegHelper` - FFmpeg command execution wrapper
- `VideoRepository` - URI/file handling and export logic
- `EditorViewModel` - MVVM state + processing workflow

## Build
```bash
./gradlew :app:assembleDebug
```

> Note: Requires Android SDK + Java runtime compatible with Android Gradle Plugin.
