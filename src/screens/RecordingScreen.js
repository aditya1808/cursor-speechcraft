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
  const [rippleAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [textSlideAnim] = useState(new Animated.Value(0));
  const [backgroundColorAnim] = useState(new Animated.Value(0));
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
          <View style={styles.headerIcon}>
            <View style={styles.headerIconLine1} />
            <View style={styles.headerIconLine2} />
            <View style={styles.headerIconLine3} />
            <View style={styles.headerIconLine4} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (isRecording) {
      // Start recording animations
      startRecordingAnimations();
    } else {
      // Stop recording animations
      stopRecordingAnimations();
    }
  }, [isRecording]);

  const startRecordingAnimations = () => {
    // Ripple effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Button scale animation
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();

    // Background color transition
    Animated.timing(backgroundColorAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Text slide in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(textSlideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const stopRecordingAnimations = () => {
    // Reset all animations
    rippleAnim.setValue(0);
    glowAnim.setValue(0);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    Animated.timing(backgroundColorAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (!speechText) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const startRecording = () => {
    // Haptic feedback simulation with scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsRecording(true);
    setSpeechText('');
    setError('');
    
    if (Platform.OS === 'web') {
      startWebSpeechRecognition();
    } else {
      simulateSpeechToText();
    }
  };

  const stopRecording = async () => {
    // Success animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsRecording(false);
    setIsListening(false);
    
    if (Platform.OS === 'web' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (speechText.trim()) {
      const processedText = await processWithAI(speechText);
      
      const note = {
        id: uuid.v4(),
        originalText: speechText,
        processedText: processedText,
        timestamp: new Date().toISOString(),
      };
      
      await saveNote(note);
      
      Alert.alert(
        '✨ Note Saved!',
        'Your speech has been beautifully formatted and saved.',
        [
          {
            text: '📋 View Notes',
            onPress: () => {
              // Smooth transition to notes
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                navigation.navigate('NotesList');
              });
            },
          },
          {
            text: '✅ OK',
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
          activeOpacity={0.9}
        >
          {/* Ripple Effect Circles */}
          {isRecording && (
            <>
              <Animated.View
                style={[
                  styles.rippleCircle,
                  {
                    transform: [
                      { scale: rippleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.5],
                      }) },
                    ],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rippleCircle,
                  {
                    transform: [
                      { scale: rippleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2],
                      }) },
                    ],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.3, 0],
                    }),
                  },
                ]}
              />
            </>
          )}
          
          {/* Main Button */}
          <Animated.View
            style={[
              styles.micButton,
              isRecording && styles.recordingButton,
              {
                transform: [{ scale: scaleAnim }],
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0.8],
                }),
              },
            ]}
          >
            <View style={styles.iconContainer}>
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View style={styles.micIcon}>
                  <View style={styles.micBody} />
                  <View style={styles.micStand} />
                  <View style={styles.micBase} />
                </View>
              )}
            </View>
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
    backgroundColor: '#fafafa', // Clean light gray
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 200,
  },
  textContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    minHeight: 150,
    marginHorizontal: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  speechText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#0f172a',
    fontWeight: '400',
  },
  listeningText: {
    fontSize: 18,
    color: '#8b5cf6',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fafafa',
    paddingBottom: 40,
    paddingTop: 30,
    alignItems: 'center',
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  recordingButton: {
    backgroundColor: '#ec4899',
    shadowColor: '#ec4899',
    borderColor: '#ffffff',
  },
  rippleCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  instructionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  bottomInstructionText: {
    marginTop: 18,
    fontSize: 14,
    color: '#8b5cf6',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingText: {
    marginTop: 18,
    fontSize: 16,
    color: '#ec4899',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBody: {
    width: 20,
    height: 28,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  micStand: {
    width: 2,
    height: 12,
    backgroundColor: '#ffffff',
    marginTop: 2,
  },
  micBase: {
    width: 16,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    marginTop: 1,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  headerIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  headerIconLine1: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    width: '100%',
  },
  headerIconLine2: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    width: '80%',
  },
  headerIconLine3: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    width: '90%',
  },
  headerIconLine4: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    width: '70%',
  },
});

export default RecordingScreen;
