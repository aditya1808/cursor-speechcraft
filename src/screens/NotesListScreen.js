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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const NotesListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
    <TouchableOpacity
      style={[styles.noteCard, { marginTop: index === 0 ? 20 : 10 }]}
      activeOpacity={0.9}
    >
      <View style={styles.noteHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.timeIcon}>🕒</Text>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => deleteNote(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
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
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No notes yet</Text>
      <Text style={styles.emptySubtitle}>
        Start recording to create your first note
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.micIcon}>🎤</Text>
        <Text style={styles.startButtonText}>Start Recording</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    color: '#6b7280',
  },
  processedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 12,
  },
  originalContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  originalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  micIcon: {
    fontSize: 20,
    color: '#fff',
  },
});

export default NotesListScreen;
