import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const { width, height } = Dimensions.get('window');

const RecordingScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NotesList')}
          style={{ marginRight: 15 }}
        >
          <Text style={styles.headerIconText}>📋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation for recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fade in text area
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.setValue(1);
      if (!speechText) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isRecording, pulseAnim, fadeAnim, speechText]);

  const startRecording = () => {
    setIsRecording(true);
    setSpeechText('');
    setError('');
    
    if (Platform.OS === 'web') {
      startWebSpeechRecognition();
    } else {
      // For mobile, we'll still use simulation for now
      // In a real app, you'd integrate react-native-voice or similar
      simulateSpeechToText();
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsListening(false);
    
    if (Platform.OS === 'web' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (speechText.trim()) {
      // Process with AI (simulated)
      const processedText = await processWithAI(speechText);
      
      // Save note
      const note = {
        id: uuid.v4(),
        originalText: speechText,
        processedText: processedText,
        timestamp: new Date().toISOString(),
      };
      
      await saveNote(note);
      
      Alert.alert(
        'Note Saved!',
        'Your speech has been converted and saved as a note.',
        [
          {
            text: 'View Notes',
            onPress: () => navigation.navigate('NotesList'),
          },
          {
            text: 'OK',
            onPress: () => setSpeechText(''),
          },
        ]
      );
    }
  };

  const startWebSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      // Fallback to simulation
      simulateSpeechToText();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the speech text with both final and interim results
      setSpeechText(prev => {
        // Remove previous interim results and add new ones
        const finalPart = prev.replace(/[^.!?]*$/, ''); // Keep everything up to last punctuation
        return finalPart + finalTranscript + interimTranscript;
      });
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const simulateSpeechToText = () => {
    // Fallback simulation for unsupported browsers or mobile
    const sampleTexts = [
      "Today I had a great meeting with the team about our new project.",
      "Remember to buy groceries: milk, eggs, bread, and fruits.",
      "The presentation went really well. Key points discussed were budget allocation and timeline.",
      "Ideas for the weekend: hiking, visiting the museum, or having a picnic in the park.",
    ];
    
    const words = sampleTexts[Math.floor(Math.random() * sampleTexts.length)].split(' ');
    let currentIndex = 0;
    
    const addWord = () => {
      if (currentIndex < words.length && isRecording) {
        setSpeechText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
        
        // Continue if still recording
        if (currentIndex < words.length) {
          setTimeout(addWord, 300);
        }
      }
    };
    
    // Start the simulation
    addWord();
  };

  const processWithAI = async (text) => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would call an AI API
    // For now, we'll just clean up the text and make it more formal
    const processed = text
      .split('. ')
      .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join('. ');
    
    return `📝 ${processed}${processed.endsWith('.') ? '' : '.'}`;
  };

  const saveNote = async (note) => {
    try {
      const existingNotes = await AsyncStorage.getItem('notes');
      const notes = existingNotes ? JSON.parse(existingNotes) : [];
      notes.unshift(note);
      await AsyncStorage.setItem('notes', JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : speechText ? (
            <Text style={styles.speechText}>{speechText}</Text>
          ) : isRecording ? (
            <Text style={styles.listeningText}>
              {Platform.OS === 'web' && isListening ? 'Listening for speech...' : 'Listening...'}
            </Text>
          ) : (
            <Text style={styles.instructionText}>
              {Platform.OS === 'web' 
                ? 'Tap the microphone to start voice recording' 
                : 'Tap the microphone to start recording (simulation)'}
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.micButton,
              isRecording && styles.recordingButton,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Use text icons for better web compatibility */}
            <Text style={styles.iconText}>
              {isRecording ? "⏹" : "🎤"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
        
        {!isRecording && !speechText && !error && (
          <Text style={styles.bottomInstructionText}>
            {Platform.OS === 'web' 
              ? 'Real microphone recording enabled' 
              : 'Simulation mode for mobile'}
          </Text>
        )}
        
        {isRecording && (
          <Text style={styles.recordingText}>
            Recording... Tap to stop
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 200,
  },
  textContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  speechText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1f2937',
  },
  listeningText: {
    fontSize: 18,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8fafc',
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomInstructionText: {
    marginTop: 15,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  recordingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  iconText: {
    fontSize: 32,
    color: '#fff',
  },
  headerIconText: {
    fontSize: 24,
    color: '#fff',
  },
});

export default RecordingScreen;
