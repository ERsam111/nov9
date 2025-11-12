import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Trash2, Mic, Square, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InventoryDataSupportProps {
  scenarioData: any;
  inputData: any;
  results: any;
  currentScenario: any;
}

export function InventoryDataSupport({
  scenarioData,
  inputData,
  results,
  currentScenario
}: InventoryDataSupportProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('inventory-data-support-tab') || 'chat';
  });
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('inventory-data-support-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (currentScenario?.id) {
      loadMessages();
    }
  }, [currentScenario?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!currentScenario?.id) return;

    const { data, error } = await (supabase as any)
      .from("data_support_messages")
      .select("*")
      .eq("scenario_id", currentScenario.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (messages.length >= 100) {
      toast({ title: "Message limit reached", description: "Please clear chat to continue", variant: "destructive" });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    if (currentScenario?.id) {
      await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "user",
        content: userMessage
      });
    }

    try {
      const context = {
        scenarioName: scenarioData?.name,
        scenarioDescription: scenarioData?.description,
        settings: scenarioData?.settings,
        inputData,
        results
      };
      
      const { data, error } = await supabase.functions.invoke('inventory-data-support', {
        body: {
          question: userMessage,
          context,
          model
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { role: "assistant", content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);

      if (currentScenario?.id) {
        await (supabase as any).from("data_support_messages").insert({
          scenario_id: currentScenario.id,
          role: "assistant",
          content: data.answer
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (currentScenario?.id) {
      await (supabase as any)
        .from("data_support_messages")
        .delete()
        .eq("scenario_id", currentScenario.id);
    }
    setMessages([]);
    toast({ title: "Chat cleared" });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        setInput(data.text);
        toast({ title: "Transcription complete" });
      };
    } catch (error: any) {
      toast({ title: "Transcription failed", description: error.message, variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Inventory Data Assistant</CardTitle>
            <CardDescription>Ask questions or transform your inventory data</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="transform" className="flex gap-2">
              <Wand2 className="h-4 w-4" />
              Transform Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col gap-3 mt-3">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your inventory data, simulation results..."
                disabled={isLoading || isTranscribing || messages.length >= 100}
                className="flex-1"
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                disabled={isLoading || isTranscribing}
                className="relative"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    <div className="absolute inset-0 flex items-end justify-center pb-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-white rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 8 + 4}px`,
                              animationDelay: `${i * 100}ms`,
                              animationDuration: '0.8s'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleSend} disabled={!input.trim() || isLoading || isTranscribing}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="transform" className="flex-1 overflow-auto mt-3">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Data Transformation</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Coming soon: Transform your inventory data with natural language commands
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
