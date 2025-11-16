import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransformationChatProps {
  scenario: any;
  rawData: any[];
  currentData: any[];
  onTransformation: (newData: any[], sqlQuery: string, description: string) => void;
}

export const TransformationChat = ({ scenario, rawData, currentData, onTransformation }: TransformationChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-flash');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('data-transformation', {
        body: {
          prompt: input,
          currentData,
          columns: Object.keys(currentData[0] || {}),
          model
        }
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant',
        content: data.explanation,
        sqlQuery: data.sqlQuery,
        previewData: data.transformedData
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply transformation if user confirms
      if (data.transformedData) {
        onTransformation(data.transformedData, data.sqlQuery, data.explanation);
        toast.success('Transformation applied successfully');
      }
    } catch (error: any) {
      console.error('Transformation error:', error);
      toast.error(error.message || 'Failed to generate transformation');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-280px)] flex flex-col">
      <CardHeader className="border-b py-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Data Transformation Assistant
          </CardTitle>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="mb-2">Ask me to transform your data!</p>
                <p className="text-sm">Examples:</p>
                <ul className="text-xs space-y-1 mt-2">
                  <li>"Filter products with price greater than 100"</li>
                  <li>"Add a column for total cost (quantity × price)"</li>
                  <li>"Group by customer and sum the order amounts"</li>
                </ul>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.sqlQuery && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono">
                      <code>{msg.sqlQuery}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe how you want to transform the data..."
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="h-[60px]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
