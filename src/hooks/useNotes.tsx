import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import CryptoJS from 'crypto-js';

export interface Note {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  public_id: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

const ENCRYPTION_KEY = 'notes-app-encryption-key-2024';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const encryptContent = (content: string): string => {
    return CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString();
  };

  const decryptContent = (encryptedContent: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedContent;
    }
  };

  const fetchNotes = async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedNotes = data?.map(note => ({
        ...note,
        content: note.is_encrypted ? decryptContent(note.content) : note.content
      })) || [];

      setNotes(processedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string, content: string, isPublic: boolean = false, shouldEncrypt: boolean = false) => {
    if (!user) return;

    try {
      const processedContent = shouldEncrypt ? encryptContent(content) : content;
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title,
          content: processedContent,
          is_public: isPublic,
          is_encrypted: shouldEncrypt
        })
        .select()
        .single();

      if (error) throw error;

      const newNote = {
        ...data,
        content: shouldEncrypt ? content : data.content
      };

      setNotes(prev => [newNote, ...prev]);
      
      toast({
        title: "Success",
        description: "Note created successfully"
      });

      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const updateNote = async (id: string, title: string, content: string, isPublic?: boolean, shouldEncrypt?: boolean) => {
    if (!user) return;

    try {
      const existingNote = notes.find(n => n.id === id);
      const finalShouldEncrypt = shouldEncrypt ?? existingNote?.is_encrypted ?? false;
      const processedContent = finalShouldEncrypt ? encryptContent(content) : content;
      
      const updateData: any = {
        title,
        content: processedContent,
        is_encrypted: finalShouldEncrypt
      };

      if (isPublic !== undefined) {
        updateData.is_public = isPublic;
      }

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedNote = {
        ...data,
        content: finalShouldEncrypt ? content : data.content
      };

      setNotes(prev => prev.map(note => 
        note.id === id ? updatedNote : note
      ));

      toast({
        title: "Success",
        description: "Note updated successfully"
      });

      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
      
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const getPublicNote = async (publicId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('public_id', publicId)
        .eq('is_public', true)
        .single();

      if (error) throw error;

      return {
        ...data,
        content: data.is_encrypted ? decryptContent(data.content) : data.content
      };
    } catch (error) {
      console.error('Error fetching public note:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    getPublicNote,
    refreshNotes: fetchNotes
  };
};