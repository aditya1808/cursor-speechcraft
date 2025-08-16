import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const NotesListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        // Add some mocked data for demonstration
        const mockNotes = [
          {
            id: 'mock-1',
            originalText: 'Welcome to SpeechCraft! This app converts your voice into well formatted notes using AI processing.',
            processedText: '🎯 SpeechCraft Introduction: Voice-to-text application with AI-powered note formatting and organization.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          },
          {
            id: 'mock-2',
            originalText: 'I need to remember to call mom and dad this weekend and also pick up groceries for the dinner party.',
            processedText: '📝 Weekend Tasks: Call parents and shop for dinner party groceries.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          },
          {
            id: 'mock-3',
            originalText: 'The meeting went really well today we discussed the new project timeline and budget allocation for next quarter.',
            processedText: '📝 Meeting Summary: Successful discussion on new project timeline and Q4 budget allocation.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          },
        ];
        setNotes(mockNotes);
        // Save mock notes to storage
        await AsyncStorage.setItem('notes', JSON.stringify(mockNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
      // Animate in when screen focuses
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const deleteNote = async (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedNotes = notes.filter(note => note.id !== noteId);
              await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
              setNotes(updatedNotes);
            } catch (error) {
              console.error('Error deleting note:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `Today at ${hours}:${minutes.toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNote = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={[styles.noteCard, { marginTop: index === 0 ? 20 : 10 }]}
        activeOpacity={0.95}
      >
      <View style={styles.noteHeader}>
        <View style={styles.dateContainer}>
          <View style={styles.timeIcon}>
            <View style={styles.clockCircle}>
              <View style={styles.clockHand1} />
              <View style={styles.clockHand2} />
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => deleteNote(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.deleteIcon}>
            <View style={styles.trashBody} />
            <View style={styles.trashLid} />
            <View style={styles.trashHandle} />
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.processedText}>{item.processedText}</Text>
      
      {item.originalText && (
        <View style={styles.originalContainer}>
          <Text style={styles.originalLabel}>Original speech:</Text>
          <Text style={styles.originalText}>{item.originalText}</Text>
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyNote} />
        <View style={styles.emptyNoteLines} />
      </View>
      <Text style={styles.emptyTitle}>No notes yet</Text>
      <Text style={styles.emptySubtitle}>
        Start recording to create your first note
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.micIcon}>
          <View style={styles.micIconBody} />
          <View style={styles.micIconStand} />
        </View>
        <Text style={styles.startButtonText}>Start Recording</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  processedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 12,
  },
  originalContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  originalLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  originalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 35,
    gap: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeIcon: {
    marginRight: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockHand1: {
    position: 'absolute',
    width: 1,
    height: 4,
    backgroundColor: '#8b5cf6',
    top: 1,
  },
  clockHand2: {
    position: 'absolute',
    width: 1,
    height: 3,
    backgroundColor: '#8b5cf6',
    transform: [{ rotate: '90deg' }],
  },
  deleteIcon: {
    width: 16,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashBody: {
    width: 12,
    height: 14,
    backgroundColor: '#ef4444',
    borderRadius: 2,
    marginTop: 2,
  },
  trashLid: {
    position: 'absolute',
    top: 1,
    width: 14,
    height: 2,
    backgroundColor: '#ef4444',
    borderRadius: 1,
  },
  trashHandle: {
    position: 'absolute',
    top: -1,
    width: 8,
    height: 2,
    backgroundColor: '#ef4444',
    borderRadius: 1,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  emptyNote: {
    width: 50,
    height: 60,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    opacity: 0.3,
  },
  emptyNoteLines: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    top: 25,
  },
  micIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIconBody: {
    width: 8,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 1,
  },
  micIconStand: {
    width: 1,
    height: 6,
    backgroundColor: '#ffffff',
  },
});

export default NotesListScreen;
