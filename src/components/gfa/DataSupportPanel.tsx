import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, Loader2, Trash2, Mic, MicOff, Sparkles, Database, Play, CheckCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Customer, Product, DistributionCenter, OptimizationSettings, ExistingSite } from "@/types/gfa";
import { useScenarios } from "@/contexts/ScenarioContext";
import { getSoundEffects } from "@/utils/soundEffects";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TransformationPlan {
  description: string;
  operations: Array<{
    type: string;
    details: string;
  }>;
  affectedData: string[];
}

interface ComparisonData {
  customers: Array<{
    name: string;
    oldDemand: number;
    newDemand: number;
    change: number;
    changePercent: number;
  }>;
}

interface DataSupportPanelProps {
  customers: Customer[];
  products: Product[];
  dcs: DistributionCenter[];
  settings: OptimizationSettings;
  existingSites?: ExistingSite[];
  costBreakdown?: {
    totalCost: number;
    transportationCost: number;
    facilityCost: number;
    numSites: number;
  };
  onDataUpdate?: (updatedData: {
    customers?: Customer[];
    products?: Product[];
    existingSites?: ExistingSite[];
    settings?: OptimizationSettings;
  }) => void;
}

export function DataSupportPanel({ customers, products, dcs, settings, existingSites = [], costBreakdown, onDataUpdate }: DataSupportPanelProps) {
  const { currentScenario } = useScenarios();
  const [activeTab, setActiveTab] = useState<"insights" | "transformation">("insights");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transformationPlan, setTransformationPlan] = useState<TransformationPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const MAX_MESSAGES = 50; // 10 prompts = 10 user + 10 assistant messages

  // Load messages from database when scenario changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentScenario) {
        setMessages([]);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("data_support_messages")
        .select("*")
        .eq("scenario_id", currentScenario.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(
          data.map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        );
      }
    };

    loadMessages();
  }, [currentScenario]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!currentScenario) {
      toast.error("Please select a scenario first");
      return;
    }

    if (customers.length === 0) {
      toast.error("Please add customer data first");
      return;
    }

    // Check message limit
    if (messages.length >= MAX_MESSAGES) {
      toast.error("Maximum 50 prompts reached. Clear chat to continue.");
      return;
    }

    // Play sent sound
    try {
      getSoundEffects().playSentSound();
    } catch (error) {
      console.log("Could not play sound:", error);
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Clear any previous transformation plan when in transformation mode
    if (activeTab === "transformation") {
      setTransformationPlan(null);
      setComparisonData(null);
    }

    try {
      // Save user message to database
      const { error: saveUserError } = await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "user",
        content: userMessage.content,
      });

      if (saveUserError) throw saveUserError;

      const { data, error } = await supabase.functions.invoke("gfa-data-support", {
        body: {
          question: userMessage.content,
          context: {
            customers,
            products,
            dcs,
            existingSites,
            settings,
            costBreakdown,
          },
          model: selectedModel,
          mode: activeTab, // "insights" or "transformation"
        },
      });

      // Handle rate limit and payment errors
      if (error) {
        // Check for specific error types from edge function
        if (data?.error) {
          if (data.error.includes("Rate limit exceeded")) {
            toast.error("Rate limit exceeded. Please wait a moment and try again.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
          if (data.error.includes("Payment required") || data.error.includes("add credits")) {
            toast.error("Lovable AI credits exhausted. Please add credits to your workspace.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
          if (data.error.includes("Invalid") && data.error.includes("API key")) {
            toast.error("Lovable AI configuration error. Please contact support.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Handle transformation mode response
      if (activeTab === "transformation" && data.transformationPlan) {
        setTransformationPlan(data.transformationPlan);
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer || "I've prepared a transformation plan for your request. Please review it below.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Play received sound
      try {
        getSoundEffects().playReceivedSound();
      } catch (error) {
        console.log("Could not play sound:", error);
      }

      // Save assistant message to database
      await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "assistant",
        content: data.answer || "Transformation plan generated",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransformation = async () => {
    if (!transformationPlan || !onDataUpdate) {
      toast.error("Cannot execute transformation: missing plan or update handler");
      return;
    }

    setIsExecuting(true);
    console.log("Starting transformation execution...");
    console.log("Current data counts:", {
      customers: customers.length,
      products: products.length,
      existingSites: existingSites.length
    });
    
    // Capture "before" snapshot of customer demands
    const beforeSnapshot = customers.map(c => ({
      name: c.name,
      demand: c.demand
    }));
    
    try {
      const { data, error } = await supabase.functions.invoke("gfa-data-support", {
        body: {
          mode: "execute-transformation",
          transformationPlan,
          currentData: {
            customers,
            products,
            existingSites,
            settings,
          },
        },
      });

      console.log("Transformation response:", data);
      console.log("Transformation error:", error);

      if (error) {
        console.error("Supabase invocation error:", error);
        throw new Error(error.message || "Failed to execute transformation");
      }

      if (data?.error) {
        console.error("Edge function returned error:", data.error);
        throw new Error(data.error);
      }

      // Update the data in parent component
      if (data?.updatedData) {
        console.log("=== EDGE FUNCTION RETURNED UPDATED DATA ===");
        console.log("Received updated data:", {
          customersCount: data.updatedData.customers?.length || 0,
          productsCount: data.updatedData.products?.length || 0,
          existingSitesCount: data.updatedData.existingSites?.length || 0
        });
        console.log("First 3 customers from response:", data.updatedData.customers?.slice(0, 3).map((c: any) => ({ name: c.name, demand: c.demand })));
        
        // Generate comparison data
        if (data.updatedData.customers) {
          const comparison: ComparisonData = {
            customers: beforeSnapshot.map(before => {
              const after = data.updatedData.customers.find((c: Customer) => c.name === before.name);
              if (after) {
                const change = after.demand - before.demand;
                const changePercent = before.demand !== 0 ? ((change / before.demand) * 100) : 0;
                return {
                  name: before.name,
                  oldDemand: before.demand,
                  newDemand: after.demand,
                  change,
                  changePercent
                };
              }
              return {
                name: before.name,
                oldDemand: before.demand,
                newDemand: before.demand,
                change: 0,
                changePercent: 0
              };
            }).filter(c => c.change !== 0) // Only show rows with changes
          };
          setComparisonData(comparison);
        }
        
        // Call the update handler
        onDataUpdate(data.updatedData);
        
        // Add success message
        const successMessage: Message = {
          role: "assistant",
          content: "✅ Transformation completed successfully! Check the comparison table below to see before/after demand values.",
        };
        setMessages((prev) => [...prev, successMessage]);

        // Save to database
        if (currentScenario) {
          await (supabase as any).from("data_support_messages").insert({
            scenario_id: currentScenario.id,
            role: "assistant",
            content: successMessage.content,
          });
        }

        toast.success("Transformation complete!");
        setTransformationPlan(null);

        // Play success sound
        try {
          getSoundEffects().playSuccessSound();
        } catch (error) {
          console.log("Could not play sound:", error);
        }
      } else {
        console.error("No updated data in response:", data);
        throw new Error("No updated data received from transformation");
      }
    } catch (error) {
      console.error("Error executing transformation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to execute transformation");
      
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Failed to execute transformation: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!currentScenario) return;

    try {
      // Delete all messages for this scenario
      const { error } = await (supabase as any).from("data_support_messages").delete().eq("scenario_id", currentScenario.id);

      if (error) throw error;

      setMessages([]);
      toast.success("Chat cleared");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
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
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
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
          // Play success sound
          try {
            getSoundEffects().playSuccessSound();
          } catch (error) {
            console.log("Could not play sound:", error);
          }

          setInput(data.text);
          toast.success("Sending message...");
          
          // Auto-send the transcribed message after a brief delay
          setTimeout(() => {
            // Simulate button click by calling handleSend
            const sendEvent = new Event('submit');
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

  // Special handler for voice messages that bypasses input field
  const handleSendVoiceMessage = async (transcribedText: string) => {
    if (!transcribedText.trim() || isLoading) return;

    if (!currentScenario) {
      toast.error("Please select a scenario first");
      return;
    }

    if (customers.length === 0) {
      toast.error("Please add customer data first");
      return;
    }

    // Check message limit
    if (messages.length >= MAX_MESSAGES) {
      toast.error("Maximum 50 prompts reached. Clear chat to continue.");
      return;
    }

    // Play sent sound
    try {
      getSoundEffects().playSentSound();
    } catch (error) {
      console.log("Could not play sound:", error);
    }

    const userMessage: Message = { role: "user", content: transcribedText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input
    setIsLoading(true);

    try {
      // Save user message to database
      const { error: saveUserError } = await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "user",
        content: userMessage.content,
      });

      if (saveUserError) throw saveUserError;

      const { data, error } = await supabase.functions.invoke("gfa-data-support", {
        body: {
          question: userMessage.content,
          context: {
            customers,
            products,
            dcs,
            settings,
            costBreakdown,
          },
          model: selectedModel,
        },
      });

      // Handle rate limit and payment errors
      if (error) {
        if (data?.error) {
          if (data.error.includes("Rate limit exceeded")) {
            toast.error("Rate limit exceeded. Please wait a moment and try again.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
          if (data.error.includes("Payment required") || data.error.includes("add credits")) {
            toast.error("Lovable AI credits exhausted. Please add credits to your workspace.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
          if (data.error.includes("Invalid") && data.error.includes("API key")) {
            toast.error("Lovable AI configuration error. Please contact support.");
            setMessages((prev) => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Play received sound
      try {
        getSoundEffects().playReceivedSound();
      } catch (error) {
        console.log("Could not play sound:", error);
      }

      // Save assistant message to database
      await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "assistant",
        content: assistantMessage.content,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const promptCount = Math.floor(messages.length / 2);

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
              Get insights or transform your data with AI assistance
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
        
        {/* Tabs for Insights and Transformation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "insights" | "transformation")} className="mt-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="transformation" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Transformation
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {activeTab === "insights" ? "Ask questions like:" : "Request data transformations like:"}
              </p>
              <ul className="text-sm text-muted-foreground mt-3 space-y-1 max-w-md">
                {activeTab === "insights" ? (
                  <>
                    <li>• How many customers do I have?</li>
                    <li>• What's the total demand across all products?</li>
                    <li>• Which country has the most customers?</li>
                    <li>• Show me the cost breakdown</li>
                    <li>• What's the population of [nearest city]?</li>
                  </>
                ) : (
                  <>
                    <li>• Increase demand for all customers by 10%</li>
                    <li>• Add 5 new customers in Germany</li>
                    <li>• Change the demand for product X by 20%</li>
                    <li>• Add an existing site in Paris</li>
                    <li>• Update unit conversion for product Y</li>
                  </>
                )}
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
              
              {/* Transformation Plan Display */}
              {transformationPlan && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Database className="h-4 w-4" />
                  <AlertDescription className="mt-2 space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">Transformation Plan:</h4>
                      <p className="text-sm text-muted-foreground mb-3">{transformationPlan.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Operations to be performed:</h5>
                      {transformationPlan.operations.map((op, idx) => (
                        <div key={idx} className="bg-background/50 p-3 rounded border">
                          <p className="text-sm font-mono text-primary mb-1">{op.type}</p>
                          <p className="text-xs text-muted-foreground">{op.details}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Affected Data:</h5>
                      <div className="flex flex-wrap gap-2">
                        {transformationPlan.affectedData.map((data, idx) => (
                          <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {data}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={executeTransformation} 
                      disabled={isExecuting}
                      className="w-full mt-3"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing Transformation...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Transformation
                        </>
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Before/After Comparison Display */}
              {comparisonData && comparisonData.customers.length > 0 && (
                <Alert className="border-green-500/30 bg-green-500/5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="mt-2">
                    <h4 className="font-semibold mb-3 text-green-600">Transformation Complete - Before/After Comparison</h4>
                    <div className="bg-background rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Customer</TableHead>
                            <TableHead className="text-right">Old Demand</TableHead>
                            <TableHead className="w-10 text-center"></TableHead>
                            <TableHead className="text-right">New Demand</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.customers.slice(0, 10).map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {row.oldDemand.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="h-4 w-4 text-primary mx-auto" />
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {row.newDemand.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${row.change > 0 ? 'text-green-600' : row.change < 0 ? 'text-red-600' : ''}`}>
                                {row.change > 0 ? '+' : ''}{row.change.toFixed(2)} ({row.changePercent > 0 ? '+' : ''}{row.changePercent.toFixed(1)}%)
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {comparisonData.customers.length > 10 && (
                        <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30">
                          Showing 10 of {comparisonData.customers.length} changed customers
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setComparisonData(null)}
                      className="w-full mt-3"
                    >
                      Dismiss Comparison
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4 bg-muted/30 shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isTranscribing
                  ? "Transcribing audio..."
                  : promptCount >= 10
                  ? "Maximum prompts reached. Clear chat to continue."
                  : "Ask a question or use voice input..."
              }
              disabled={isLoading || promptCount >= 10 || isTranscribing}
              className="flex-1"
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || promptCount >= 10 || isTranscribing}
              variant={isRecording ? "destructive" : "outline"}
              className="shrink-0"
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || promptCount >= 10 || isTranscribing}
              className="shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
