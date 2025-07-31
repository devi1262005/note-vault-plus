import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface NoteFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialIsPublic?: boolean;
  initialShouldEncrypt?: boolean;
  onSubmit: (title: string, content: string, isPublic: boolean, shouldEncrypt: boolean) => Promise<void>;
  submitLabel?: string;
}

export const NoteForm = ({ 
  initialTitle = '', 
  initialContent = '', 
  initialIsPublic = false,
  initialShouldEncrypt = false,
  onSubmit, 
  submitLabel = 'Create Note' 
}: NoteFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shouldEncrypt, setShouldEncrypt] = useState(initialShouldEncrypt);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(title.trim(), content.trim(), isPublic, shouldEncrypt);
      if (submitLabel === 'Create Note') {
        setTitle('');
        setContent('');
        setIsPublic(false);
        setShouldEncrypt(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          rows={6}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="public"
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="public" className="text-sm">
            Make this note public (accessible via shareable link)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="encrypt"
            checked={shouldEncrypt}
            onCheckedChange={(checked) => setShouldEncrypt(checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="encrypt" className="text-sm">
            Encrypt note content for extra security
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !title.trim()}>
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
};