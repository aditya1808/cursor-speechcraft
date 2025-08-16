# SpeechCraft 🎤

A modern React Native app that converts speech to well-formatted notes using AI processing and real-time voice recognition.

## Features

- 🎤 **Real-time Voice Recording** - Uses Web Speech API for live transcription
- 🤖 **AI Text Processing** - Automatically formats and enhances your spoken notes
- 📱 **Cross-Platform** - Works on web browsers and mobile devices
- 💾 **Local Storage** - All notes saved securely on your device
- 🎨 **Modern UI** - Beautiful, intuitive interface with smooth animations

## Screenshots

### Recording Screen
- Clean interface with microphone button
- Real-time transcription as you speak
- Visual feedback during recording

### Notes List
- View all your saved notes
- Organized by timestamp
- Easy delete functionality

## Technology Stack

- **React Native** 0.72.6
- **Expo** SDK 49
- **React Navigation** v6
- **AsyncStorage** for local persistence
- **Web Speech API** for voice recognition

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/speechcraft.git
cd speechcraft
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
- **Web**: Press `w` or visit http://localhost:8081
- **Android**: Press `a` (requires Android emulator)
- **iOS**: Press `i` (requires iOS simulator - Mac only)

## Usage

### Recording Notes
1. Tap the microphone button 🎤
2. Allow microphone access when prompted (web only)
3. Start speaking - see your words appear in real-time
4. Tap the stop button ⏹ when finished
5. Your note is automatically processed and saved

### Managing Notes
- View all notes in the Notes List screen
- Tap 📋 to navigate to your notes
- Tap 🗑️ to delete unwanted notes
- Pull to refresh the notes list

## Browser Compatibility

### Speech Recognition Support:
- ✅ Chrome/Edge (recommended)
- ✅ Safari (with limitations)
- ❌ Firefox (fallback to simulation)

For unsupported browsers, the app automatically falls back to text simulation mode.

## Development

### Project Structure
```
speechcraft/
├── src/
│   └── screens/
│       ├── RecordingScreen.js    # Main recording interface
│       └── NotesListScreen.js    # Notes management
├── App.js                        # Navigation setup
├── package.json                  # Dependencies
└── README.md                     # This file
```

### Key Components
- **RecordingScreen**: Handles voice input and real-time transcription
- **NotesListScreen**: Displays and manages saved notes
- **Web Speech API Integration**: Real-time speech-to-text conversion

## Future Enhancements

- 🔊 **Playback** - Listen to original recordings
- ☁️ **Cloud Sync** - Backup notes to cloud storage
- 🏷️ **Categories** - Organize notes with tags
- 🔍 **Search** - Find notes by content
- 📤 **Export** - Share notes in various formats
- 🌍 **Multi-language** - Support for multiple languages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [React Native](https://reactnative.dev/)
- Powered by [Expo](https://expo.dev/)
- Uses [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

**SpeechCraft** - Transform your voice into organized, formatted notes effortlessly! 🚀