import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  customerDemand?: Array<{
    name: string;
    oldDemand: number;
    newDemand: number;
    change: number;
    changePercent: number;
  }>;
  customerLocation?: Array<{
    name: string;
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  products?: Array<{
    name: string;
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  existingSites?: Array<{
    name: string;
    action: 'added' | 'removed';
  }>;
  settings?: {
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
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
  const [pendingUpdatedData, setPendingUpdatedData] = useState<any>(null);
  const [beforeSnapshot, setBeforeSnapshot] = useState<any>(null); // Store before data for full preview
  const [editableQuery, setEditableQuery] = useState<string>("");
  const [showQueryEditor, setShowQueryEditor] = useState(false);
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
      setPendingUpdatedData(null);
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
        // Show query editor for user to review/edit
        const queryText = data.transformationPlan.operations
          .map((op: any) => op.details)
          .join('\n');
        setEditableQuery(queryText);
        setTransformationPlan(data.transformationPlan);
        setShowQueryEditor(true);
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer || "I've prepared a transformation plan for your request. Please review and edit it below.",
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

  const applyEditedTransformation = async () => {
    if (!transformationPlan || !onDataUpdate) {
      toast.error("Cannot execute transformation: missing plan or update handler");
      return;
    }
    
    setShowQueryEditor(false);
    
    // Update the transformation plan with edited queries
    const editedOperations = editableQuery.split('\n')
      .filter(line => line.trim())
      .map(detail => ({
        type: "UPDATE",
        details: detail.trim()
      }));
    
    const updatedPlan = {
      ...transformationPlan,
      operations: editedOperations
    };
    
    setTransformationPlan(updatedPlan);
    
    // Now execute with updated plan
    executeTransformation(updatedPlan);
  };

  const executeTransformation = async (planToExecute?: TransformationPlan) => {
    const plan = planToExecute || transformationPlan;
    
    if (!plan || !onDataUpdate) {
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
    
    // Capture "before" snapshots of all data - STORE ALL COLUMNS
    const beforeSnapshotData = {
      customers: JSON.parse(JSON.stringify(customers)), // Full deep copy with all columns
      products: JSON.parse(JSON.stringify(products)), // Full deep copy with all columns
      existingSites: JSON.parse(JSON.stringify(existingSites)), // Full deep copy with all columns
      settings: JSON.parse(JSON.stringify(settings)) // Full deep copy with all fields
    };
    
    // Store in state for preview display
    setBeforeSnapshot(beforeSnapshotData);
    
    try {
      const { data, error } = await supabase.functions.invoke("gfa-data-support", {
        body: {
          mode: "execute-transformation",
          transformationPlan: plan,
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
        
        // Generate comparison data for all affected data types
        const comparison: ComparisonData = {};
        
        // Customer demand comparison
        if (data.updatedData.customers) {
          const demandChanges = beforeSnapshotData.customers.map(before => {
            const after = data.updatedData.customers.find((c: Customer) => c.name === before.name);
            if (after && after.demand !== before.demand) {
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
            return null;
          }).filter((c): c is NonNullable<typeof c> => c !== null);
          
          if (demandChanges.length > 0) {
            comparison.customerDemand = demandChanges;
          }
          
          // Customer location/attribute comparison
          const locationChanges = [];
          for (const before of beforeSnapshotData.customers) {
            const after = data.updatedData.customers.find((c: Customer) => c.name === before.name);
            if (after) {
              if (after.city !== before.city) {
                locationChanges.push({ name: before.name, field: 'City', oldValue: before.city, newValue: after.city });
              }
              if (after.country !== before.country) {
                locationChanges.push({ name: before.name, field: 'Country', oldValue: before.country, newValue: after.country });
              }
              if (after.latitude !== before.latitude) {
                locationChanges.push({ name: before.name, field: 'Latitude', oldValue: before.latitude, newValue: after.latitude });
              }
              if (after.longitude !== before.longitude) {
                locationChanges.push({ name: before.name, field: 'Longitude', oldValue: before.longitude, newValue: after.longitude });
              }
            }
          }
          
          if (locationChanges.length > 0) {
            comparison.customerLocation = locationChanges;
          }
        }
        
        // Product comparison
        if (data.updatedData.products) {
          const productChanges = [];
          
          for (const before of beforeSnapshotData.products) {
            const after = data.updatedData.products.find((p: Product) => p.name === before.name);
            if (after) {
              if (after.sellingPrice !== before.sellingPrice) {
                productChanges.push({
                  name: before.name,
                  field: 'Selling Price',
                  oldValue: before.sellingPrice ?? 'Not set',
                  newValue: after.sellingPrice ?? 'Not set'
                });
              }
              if (after.baseUnit !== before.baseUnit) {
                productChanges.push({
                  name: before.name,
                  field: 'Base Unit',
                  oldValue: before.baseUnit,
                  newValue: after.baseUnit
                });
              }
              // Check unit conversions
              const beforeConv = JSON.stringify(before.unitConversions || {});
              const afterConv = JSON.stringify(after.unitConversions || {});
              if (beforeConv !== afterConv) {
                productChanges.push({
                  name: before.name,
                  field: 'Unit Conversions',
                  oldValue: beforeConv,
                  newValue: afterConv
                });
              }
            }
          }
          
          if (productChanges.length > 0) {
            comparison.products = productChanges;
          }
        }
        
        // Existing sites comparison
        if (data.updatedData.existingSites) {
          const siteChanges = [];
          
          // Check for new sites
          for (const after of data.updatedData.existingSites) {
            const before = beforeSnapshotData.existingSites.find(s => s.name === after.name);
            if (!before) {
              siteChanges.push({
                name: after.name || after.city,
                action: 'added' as const
              });
            }
          }
          
          // Check for removed sites
          for (const before of beforeSnapshotData.existingSites) {
            const after = data.updatedData.existingSites.find((s: ExistingSite) => s.name === before.name);
            if (!after) {
              siteChanges.push({
                name: before.name,
                action: 'removed' as const
              });
            }
          }
          
          if (siteChanges.length > 0) {
            comparison.existingSites = siteChanges;
          }
        }
        
        // Settings comparison
        if (data.updatedData.settings) {
          const settingsChanges = [];
          const fieldsToCheck = [
            { key: 'dcCapacity', label: 'DC Capacity' },
            { key: 'numDCs', label: 'Number of DCs' },
            { key: 'transportationCostPerMilePerUnit', label: 'Transportation Cost' },
            { key: 'facilityCost', label: 'Facility Cost' },
            { key: 'distanceUnit', label: 'Distance Unit' },
            { key: 'capacityUnit', label: 'Capacity Unit' },
            { key: 'costUnit', label: 'Cost Unit' }
          ];
          
          for (const field of fieldsToCheck) {
            const oldVal = (beforeSnapshotData.settings as any)[field.key];
            const newVal = (data.updatedData.settings as any)[field.key];
            if (oldVal !== newVal) {
              settingsChanges.push({
                field: field.label,
                oldValue: oldVal,
                newValue: newVal
              });
            }
          }
          
          if (settingsChanges.length > 0) {
            comparison.settings = { changes: settingsChanges };
          }
        }
        
        if (Object.keys(comparison).length > 0) {
          setComparisonData(comparison);
        }
        
        // Store the updated data for later acceptance
        setPendingUpdatedData(data.updatedData);
        
        // Add preview message
        const previewMessage: Message = {
          role: "assistant",
          content: "✅ Transformation preview ready! Review the changes below and click 'Accept Changes' to apply them.",
        };
        setMessages((prev) => [...prev, previewMessage]);

        // Save to database
        if (currentScenario) {
          await (supabase as any).from("data_support_messages").insert({
            scenario_id: currentScenario.id,
            role: "assistant",
            content: previewMessage.content,
          });
        }

        toast.success("Preview generated - review and accept changes");
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

  const acceptChanges = async () => {
    if (!pendingUpdatedData || !onDataUpdate) {
      toast.error("No pending changes to accept");
      return;
    }

    // Apply the changes
    onDataUpdate(pendingUpdatedData);
    
    // Add success message
    const successMessage: Message = {
      role: "assistant",
      content: "✅ Changes applied successfully! Your data has been updated.",
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

    // Clear pending data and comparison
    setPendingUpdatedData(null);
    setComparisonData(null);
    
    toast.success("Changes applied!");
    
    // Play success sound
    try {
      getSoundEffects().playSuccessSound();
    } catch (error) {
      console.log("Could not play sound:", error);
    }
  };

  const rejectChanges = async () => {
    // Add rejection message
    const rejectMessage: Message = {
      role: "assistant",
      content: "❌ Changes rejected. Your original data remains unchanged.",
    };
    setMessages((prev) => [...prev, rejectMessage]);

    // Save to database
    if (currentScenario) {
      await (supabase as any).from("data_support_messages").insert({
        scenario_id: currentScenario.id,
        role: "assistant",
        content: rejectMessage.content,
      });
    }

    // Clear pending data and comparison
    setPendingUpdatedData(null);
    setComparisonData(null);
    
    toast.info("Changes rejected");
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

    // Clear any previous transformation plan when in transformation mode
    if (activeTab === "transformation") {
      setTransformationPlan(null);
      setComparisonData(null);
      setPendingUpdatedData(null);
      setShowQueryEditor(false);
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
        // Show query editor for user to review/edit
        const queryText = data.transformationPlan.operations
          .map((op: any) => op.details)
          .join('\n');
        setEditableQuery(queryText);
        setTransformationPlan(data.transformationPlan);
        setShowQueryEditor(true);
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer || "I've prepared a transformation plan for your request. Please review and edit it below.",
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
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const promptCount = Math.floor(messages.length / 2);

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-primary/20">
      <CardHeader className="border-b border-border/50 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Data Assistant</CardTitle>
            </div>
            
            {/* Compact Mode Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("insights")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  activeTab === "insights"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {activeTab === "insights" && <CheckCircle className="h-3 w-3" />}
                <Sparkles className="h-3 w-3" />
                Insights
              </button>
              <button
                onClick={() => setActiveTab("transformation")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  activeTab === "transformation"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {activeTab === "transformation" && <CheckCircle className="h-3 w-3" />}
                <Database className="h-3 w-3" />
                Transform
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-7 px-2">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini ⭐</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
                    <li>• Increase demand for all customers by 20%</li>
                    <li>• Set selling price to 15 for all products</li>
                    <li>• Change transportation cost to 0.8 per mile</li>
                    <li>• Update facility cost to 75000</li>
                    <li>• Change customer 'New York City 1' city to 'Boston'</li>
                    <li>• Set latitude 40.7128 and longitude -74.0060 for customer 'Manhattan 1'</li>
                    <li>• Update unit conversion m3 = 1.5 for product 'Product A'</li>
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
              
              {/* Query Editor */}
              {showQueryEditor && transformationPlan && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Database className="h-4 w-4" />
                  <AlertDescription className="mt-2 space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">Review & Edit Transformation</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {transformationPlan.description}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Review and edit the SQL-like operations before executing. Each line represents one operation.
                      </p>
                    </div>
                    
                    {/* Table and Column Reference - ALL COLUMNS */}
                    <div className="bg-background/80 border rounded-lg p-3 text-xs space-y-3">
                      <p className="font-semibold text-primary text-sm">📋 Available Tables & All Columns (All Changeable with Preview):</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Customers Table */}
                        <div className="border-l-2 border-primary/30 pl-3">
                          <p className="font-semibold text-primary mb-1.5">🧑‍💼 Table Name: <code className="bg-muted px-2 py-0.5 rounded text-xs">customers</code></p>
                          <p className="text-[10px] text-muted-foreground mb-1">Use in queries: <code className="bg-muted px-1 py-0.5 rounded">UPDATE customers SET ...</code></p>
                          <ul className="text-muted-foreground space-y-0.5 ml-2 text-[11px]">
                            <li>• <span className="font-medium">id</span> (text) - Unique customer ID</li>
                            <li>• <span className="font-medium">name</span> (text) - Customer name</li>
                            <li>• <span className="font-medium">product</span> (text) - Product ordered</li>
                            <li>• <span className="font-medium">demand</span> (number) - Quantity demanded ✏️</li>
                            <li>• <span className="font-medium">city</span> (text) - Customer city ✏️</li>
                            <li>• <span className="font-medium">country</span> (text) - Customer country ✏️</li>
                            <li>• <span className="font-medium">latitude</span> (number) - Latitude coordinate ✏️</li>
                            <li>• <span className="font-medium">longitude</span> (number) - Longitude coordinate ✏️</li>
                            <li>• <span className="font-medium">unitOfMeasure</span> (text) - Unit of measure</li>
                            <li>• <span className="font-medium">conversionFactor</span> (number) - Conversion factor</li>
                          </ul>
                        </div>

                        {/* Products Table */}
                        <div className="border-l-2 border-blue-500/30 pl-3">
                          <p className="font-semibold text-blue-600 mb-1.5">📦 Table Name: <code className="bg-muted px-2 py-0.5 rounded text-xs">products</code></p>
                          <p className="text-[10px] text-muted-foreground mb-1">Use in queries: <code className="bg-muted px-1 py-0.5 rounded">UPDATE products SET ...</code></p>
                          <ul className="text-muted-foreground space-y-0.5 ml-2 text-[11px]">
                            <li>• <span className="font-medium">name</span> (text) - Product name</li>
                            <li>• <span className="font-medium">baseUnit</span> (text) - Base unit (kg, lbs, etc) ✏️</li>
                            <li>• <span className="font-medium">sellingPrice</span> (number) - Price per unit ✏️</li>
                            <li>• <span className="font-medium">unitConversions</span> (object) - Unit conversion factors ✏️</li>
                          </ul>
                        </div>

                        {/* Existing Sites Table */}
                        <div className="border-l-2 border-purple-500/30 pl-3">
                          <p className="font-semibold text-purple-600 mb-1.5">🏭 Table Name: <code className="bg-muted px-2 py-0.5 rounded text-xs">existingSites</code></p>
                          <p className="text-[10px] text-muted-foreground mb-1">Use in queries: <code className="bg-muted px-1 py-0.5 rounded">UPDATE existingSites SET ...</code></p>
                          <ul className="text-muted-foreground space-y-0.5 ml-2 text-[11px]">
                            <li>• <span className="font-medium">id</span> (text) - Site ID</li>
                            <li>• <span className="font-medium">name</span> (text) - Site name ✏️</li>
                            <li>• <span className="font-medium">city</span> (text) - Site city ✏️</li>
                            <li>• <span className="font-medium">country</span> (text) - Site country ✏️</li>
                            <li>• <span className="font-medium">latitude</span> (number) - Latitude ✏️</li>
                            <li>• <span className="font-medium">longitude</span> (number) - Longitude ✏️</li>
                            <li>• <span className="font-medium">capacity</span> (number) - Site capacity ✏️</li>
                            <li>• <span className="font-medium">capacityUnit</span> (text) - Capacity unit ✏️</li>
                          </ul>
                        </div>

                        {/* Settings/Cost Parameters */}
                        <div className="border-l-2 border-orange-500/30 pl-3">
                          <p className="font-semibold text-orange-600 mb-1.5">⚙️ Table Name: <code className="bg-muted px-2 py-0.5 rounded text-xs">settings</code></p>
                          <p className="text-[10px] text-muted-foreground mb-1">Use in queries: <code className="bg-muted px-1 py-0.5 rounded">UPDATE settings SET ...</code></p>
                          <ul className="text-muted-foreground space-y-0.5 ml-2 text-[11px]">
                            <li>• <span className="font-medium">mode</span> (text) - Optimization mode ✏️</li>
                            <li>• <span className="font-medium">numDCs</span> (number) - Number of DCs ✏️</li>
                            <li>• <span className="font-medium">dcCapacity</span> (number) - DC capacity ✏️</li>
                            <li>• <span className="font-medium">maxRadius</span> (number) - Max service radius ✏️</li>
                            <li>• <span className="font-medium">demandPercentage</span> (number) - Demand % to cover ✏️</li>
                            <li>• <span className="font-medium">transportationCostPerMilePerUnit</span> (number) - Transport cost ✏️</li>
                            <li>• <span className="font-medium">facilityCost</span> (number) - Facility opening cost ✏️</li>
                            <li>• <span className="font-medium">distanceUnit</span> (text) - km or mile ✏️</li>
                            <li>• <span className="font-medium">capacityUnit</span> (text) - Capacity unit ✏️</li>
                            <li>• <span className="font-medium">costUnit</span> (text) - Cost calculation unit ✏️</li>
                          </ul>
                        </div>
                      </div>
                      
                      {/* Examples Section */}
                      <div className="bg-muted/50 rounded p-2 mt-3">
                        <p className="font-semibold text-primary mb-1.5">💡 SQL UPDATE Examples (All Columns Editable):</p>
                        <ul className="text-muted-foreground space-y-0.5 ml-2 font-mono text-[10px]">
                          <li>• UPDATE customers SET demand = demand * 1.5</li>
                          <li>• UPDATE customers SET city = 'New York' WHERE name = 'Customer A'</li>
                          <li>• UPDATE customers SET latitude = 40.7128, longitude = -74.0060</li>
                          <li>• UPDATE products SET sellingPrice = 100 WHERE name = 'Product A'</li>
                          <li>• UPDATE products SET baseUnit = 'kg'</li>
                          <li>• UPDATE existingSites SET capacity = 50000 WHERE city = 'Chicago'</li>
                          <li>• UPDATE existingSites SET name = 'Warehouse 1', city = 'Boston'</li>
                          <li>• UPDATE settings SET facilityCost = 3000000</li>
                          <li>• UPDATE settings SET transportationCostPerMilePerUnit = 2.5</li>
                          <li>• UPDATE settings SET distanceUnit = 'km', capacityUnit = 'tons'</li>
                        </ul>
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                          ✨ Any column from any table can be updated! Use exact table names: customers, products, existingSites, settings
                        </p>
                      </div>
                    </div>
                    
                    <Textarea
                      value={editableQuery}
                      onChange={(e) => setEditableQuery(e.target.value)}
                      className="font-mono text-sm min-h-[120px] bg-background"
                      placeholder="UPDATE customers SET demand = demand * 1.5"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={applyEditedTransformation} 
                        disabled={isExecuting || !editableQuery.trim()}
                        className="flex-1"
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute & Preview Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowQueryEditor(false);
                          setTransformationPlan(null);
                        }} 
                        variant="outline"
                        disabled={isExecuting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Transformation Plan Display */}
              {transformationPlan && !showQueryEditor && (
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
                      onClick={() => executeTransformation()} 
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
              
              {/* Before/After Comparison Display - All Data Types with Full Column View */}
              {comparisonData && Object.keys(comparisonData).length > 0 && (
                <div className="space-y-3">
                  {/* ALL COLUMNS VIEW SECTION */}
                  {pendingUpdatedData && (
                    <Alert className="border-primary/30 bg-primary/5">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-primary">Full Data Preview - All Tables & Columns</h4>
                        <div className="space-y-4 text-xs">
                          {/* Customers Table - All Columns */}
                          {pendingUpdatedData.customers && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Customers Table (First 3 rows showing all columns)</h5>
                              <p className="text-muted-foreground">
                                Columns: {pendingUpdatedData.customers[0] ? Object.keys(pendingUpdatedData.customers[0]).join(', ') : 'N/A'}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Before:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(beforeSnapshot?.customers?.slice(0, 3), null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">After:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(pendingUpdatedData.customers?.slice(0, 3), null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Products Table - All Columns */}
                          {pendingUpdatedData.products && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Products Table (All products showing all columns)</h5>
                              <p className="text-muted-foreground">
                                Columns: {pendingUpdatedData.products[0] ? Object.keys(pendingUpdatedData.products[0]).join(', ') : 'N/A'}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Before:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(beforeSnapshot?.products, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">After:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(pendingUpdatedData.products, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Existing Sites Table - All Columns */}
                          {pendingUpdatedData.existingSites && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Existing Sites Table (All sites showing all columns)</h5>
                              <p className="text-muted-foreground">
                                Columns: {pendingUpdatedData.existingSites[0] ? Object.keys(pendingUpdatedData.existingSites[0]).join(', ') : 'N/A'}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Before:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(beforeSnapshot?.existingSites, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">After:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(pendingUpdatedData.existingSites, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Cost Parameters - All Fields */}
                          {pendingUpdatedData.settings && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Cost Parameters (All fields)</h5>
                              <p className="text-muted-foreground">
                                Fields: {Object.keys(pendingUpdatedData.settings).join(', ')}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Before:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(beforeSnapshot?.settings, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">After:</p>
                                  <pre className="bg-muted p-2 rounded overflow-auto max-h-32 text-xs">
                                    {JSON.stringify(pendingUpdatedData.settings, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* Customer Demand Comparison */}
                  {comparisonData.customerDemand && comparisonData.customerDemand.length > 0 && (
                    <Alert className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 animate-fade-in backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 animate-scale-in" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Customer Demand Changes
                        </h4>
                        <div className="bg-background/80 rounded-lg border border-green-500/20 overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-300">
                                <TableHead className="w-[30%] font-semibold">Customer</TableHead>
                                <TableHead className="text-right font-semibold">Old Demand</TableHead>
                                <TableHead className="w-10 text-center"></TableHead>
                                <TableHead className="text-right font-semibold">New Demand</TableHead>
                                <TableHead className="text-right font-semibold">Change</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparisonData.customerDemand.slice(0, 10).map((row, idx) => (
                                <TableRow 
                                  key={idx} 
                                  className="hover:bg-green-500/5 transition-all duration-200 animate-fade-in group"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <TableCell className="font-medium group-hover:text-green-700 transition-colors">{row.name}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    <span className="group-hover:scale-105 inline-block transition-transform">
                                      {row.oldDemand.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="h-4 w-4 text-green-600 mx-auto group-hover:translate-x-1 transition-transform duration-300" />
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-green-700">
                                    <span className="group-hover:scale-110 inline-block transition-transform">
                                      {row.newDemand.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className={`text-right font-semibold ${row.change > 0 ? 'text-green-600' : row.change < 0 ? 'text-red-600' : ''}`}>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 group-hover:scale-105 transition-transform">
                                      {row.change > 0 ? '+' : ''}{row.change.toFixed(2)} ({row.changePercent > 0 ? '+' : ''}{row.changePercent.toFixed(1)}%)
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {comparisonData.customerDemand.length > 10 && (
                            <div className="text-xs text-muted-foreground text-center py-3 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-t border-green-500/10">
                              <span className="font-medium">Showing 10 of {comparisonData.customerDemand.length} changed customers</span>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Customer Location/Attributes Comparison */}
                  {comparisonData.customerLocation && comparisonData.customerLocation.length > 0 && (
                    <Alert className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 animate-fade-in backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-amber-600 animate-scale-in" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-amber-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Customer Location/Attributes Changes
                        </h4>
                        <div className="bg-background/80 rounded-lg border border-amber-500/20 overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300">
                                <TableHead className="w-[30%] font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold">Field</TableHead>
                                <TableHead className="font-semibold">Old Value</TableHead>
                                <TableHead className="w-10 text-center"></TableHead>
                                <TableHead className="font-semibold">New Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparisonData.customerLocation.map((row, idx) => (
                                <TableRow 
                                  key={idx}
                                  className="hover:bg-amber-500/5 transition-all duration-200 animate-fade-in group"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <TableCell className="font-medium group-hover:text-amber-700 transition-colors">{row.name}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/20 text-xs font-medium">
                                      {row.field}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground group-hover:scale-105 transition-transform">{String(row.oldValue)}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="h-4 w-4 text-amber-600 mx-auto group-hover:translate-x-1 transition-transform duration-300" />
                                  </TableCell>
                                  <TableCell className="font-semibold text-amber-700 group-hover:scale-105 transition-transform">{String(row.newValue)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Product Changes */}
                  {comparisonData.products && comparisonData.products.length > 0 && (
                    <Alert className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 animate-fade-in backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600 animate-scale-in" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Product Changes
                        </h4>
                        <div className="bg-background/80 rounded-lg border border-blue-500/20 overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 hover:from-blue-500/10 hover:to-cyan-500/10 transition-all duration-300">
                                <TableHead className="w-[30%] font-semibold">Product Name</TableHead>
                                <TableHead className="font-semibold">Field</TableHead>
                                <TableHead className="font-semibold">Old Value</TableHead>
                                <TableHead className="w-10 text-center"></TableHead>
                                <TableHead className="font-semibold">New Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparisonData.products.map((row, idx) => (
                                <TableRow 
                                  key={idx}
                                  className="hover:bg-blue-500/5 transition-all duration-200 animate-fade-in group"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <TableCell className="font-medium group-hover:text-blue-700 transition-colors">{row.name}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/20 text-xs font-medium">
                                      {row.field}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground group-hover:scale-105 transition-transform">{String(row.oldValue)}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="h-4 w-4 text-blue-600 mx-auto group-hover:translate-x-1 transition-transform duration-300" />
                                  </TableCell>
                                  <TableCell className="font-semibold text-blue-700 group-hover:scale-105 transition-transform">{String(row.newValue)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Existing Sites Changes */}
                  {comparisonData.existingSites && comparisonData.existingSites.length > 0 && (
                    <Alert className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 animate-fade-in backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-purple-600 animate-scale-in" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-purple-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Existing Sites Changes
                        </h4>
                        <div className="bg-background/80 rounded-lg border border-purple-500/20 overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300">
                                <TableHead className="font-semibold">Site Name</TableHead>
                                <TableHead className="font-semibold">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparisonData.existingSites.map((row, idx) => (
                                <TableRow 
                                  key={idx}
                                  className="hover:bg-purple-500/5 transition-all duration-200 animate-fade-in group"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <TableCell className="font-medium group-hover:text-purple-700 transition-colors">{row.name}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm transition-all group-hover:scale-105 ${
                                      row.action === 'added' 
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400' 
                                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-400'
                                    }`}>
                                      {row.action === 'added' ? '✓ Added' : '✗ Removed'}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Cost Parameters Changes */}
                  {comparisonData.settings && comparisonData.settings.changes.length > 0 && (
                    <Alert className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-amber-500/5 animate-fade-in backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-orange-600 animate-scale-in" />
                      <AlertDescription className="mt-2">
                        <h4 className="font-semibold mb-3 text-orange-600 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Cost Parameters Changes
                        </h4>
                        <div className="bg-background/80 rounded-lg border border-orange-500/20 overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10 transition-all duration-300">
                                <TableHead className="font-semibold">Parameter</TableHead>
                                <TableHead className="font-semibold">Old Value</TableHead>
                                <TableHead className="w-10 text-center"></TableHead>
                                <TableHead className="font-semibold">New Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {comparisonData.settings.changes.map((row, idx) => (
                                <TableRow 
                                  key={idx}
                                  className="hover:bg-orange-500/5 transition-all duration-200 animate-fade-in group"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <TableCell className="font-medium group-hover:text-orange-700 transition-colors">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/20 text-xs font-medium">
                                      {row.field}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground group-hover:scale-105 transition-transform">{String(row.oldValue)}</TableCell>
                                  <TableCell className="text-center">
                                    <ArrowRight className="h-4 w-4 text-orange-600 mx-auto group-hover:translate-x-1 transition-transform duration-300" />
                                  </TableCell>
                                  <TableCell className="font-semibold text-orange-700 group-hover:scale-105 transition-transform">{String(row.newValue)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Accept/Reject Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={acceptChanges}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Changes
                    </Button>
                    <Button
                      onClick={rejectChanges}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reject Changes
                    </Button>
                  </div>
                </div>
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
