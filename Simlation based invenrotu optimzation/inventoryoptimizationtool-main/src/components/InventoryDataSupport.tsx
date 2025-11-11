import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Bot, User, Loader2, Trash2, Mic, MicOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// Create Supabase client for external calls
const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InventoryDataSupportProps {
  scenarioId?: string;
  scenarioName?: string;
  scenarioDescription?: string;
  inputData: {
    customerData: any[];
    facilityData: any[];
    productData: any[];
    customerFulfillmentData: any[];
    replenishmentData: any[];
    productionData: any[];
    inventoryPolicyData: any[];
    warehousingData: any[];
    orderFulfillmentData: any[];
    transportationData: any[];
    transportationModeData: any[];
    customerOrderData: any[];
    bomData: any[];
    groupData: any[];
    unitOfMeasureData: any[];
    inputFactorsData: any[];
  };
  results: {
    simulationResults: any[];
    orderLogResults: any[];
    inventoryData: any[];
    productionLogResults: any[];
    productFlowLogResults: any[];
    tripLogResults: any[];
  };
  settings: {
    replications: number;
  };
}

export function InventoryDataSupport({ 
  scenarioId,
  scenarioName,
  scenarioDescription,
  inputData, 
  results, 
  settings 
}: InventoryDataSupportProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const MAX_MESSAGES = 50;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabaseClient.functions.invoke("inventory-data-support", {
        body: {
          question: userMessage.content,
          context: {
            inputData,
            results,
            settings,
            scenarioName,
            scenarioDescription,
          },
          model: selectedModel,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      toast.info("Processing audio...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        const { data, error } = await supabaseClient.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        setIsTranscribing(false);

        if (error) {
          console.error("Transcription error:", error);
          toast.error("Failed to transcribe audio");
          return;
        }

        if (data?.error) {
          console.error("Transcription error:", data.error);
          toast.error(data.error);
          return;
        }

        if (data?.text) {
          setInput(data.text);
          toast.success("Sending message...");
          setTimeout(() => {
            handleSendVoiceMessage(data.text);
          }, 500);
        }
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setIsTranscribing(false);
      toast.error("Failed to transcribe audio");
    }
  };

  const handleSendVoiceMessage = async (transcribedText: string) => {
    if (!transcribedText.trim() || isLoading) return;

    if (messages.length >= MAX_MESSAGES) {
      toast.error("Maximum 50 prompts reached. Clear chat to continue.");
      return;
    }

    const userMessage: Message = { role: "user", content: transcribedText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabaseClient.functions.invoke("inventory-data-support", {
        body: {
          question: userMessage.content,
          context: {
            inputData,
            results,
            settings,
            scenarioName,
            scenarioDescription,
          },
          model: selectedModel,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-280px)] flex flex-col shadow-lg border-primary/20">
      <CardHeader className="border-b border-border/50 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              Data Support Assistant
            </CardTitle>
            <CardDescription className="mt-1">
              Ask questions about your input data, optimization process, costs, and results
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[240px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap) ⭐</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy Cheap)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (Capable)</SelectItem>
                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Latest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md">Ask questions like:</p>
              <ul className="text-sm text-muted-foreground mt-3 space-y-1 max-w-md text-left">
                <li>• What is the best scenario and why?</li>
                <li>• How many orders are there in total?</li>
                <li>• Explain the different cost elements</li>
                <li>• Trace the path of product X from supplier to customer</li>
                <li>• What is the demand by product?</li>
                <li>• How does the inventory policy work?</li>
                <li>• Show me the production schedule</li>
                <li>• What are the transportation costs?</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-4 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                messages.length >= MAX_MESSAGES ? "Maximum prompts reached" : "Ask a question about your data..."
              }
              disabled={isLoading || isTranscribing || messages.length >= MAX_MESSAGES}
              className="flex-1"
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isTranscribing || messages.length >= MAX_MESSAGES}
              variant="outline"
              size="icon"
              className={isRecording ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isTranscribing || messages.length >= MAX_MESSAGES}
              size="icon"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>
              {Math.floor(messages.length / 2)}/{MAX_MESSAGES / 2} prompts
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
