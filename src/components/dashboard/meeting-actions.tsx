"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video, Plus, Search, Sparkles, Copy, CheckCircle2, Calendar as CalendarIcon, Users, Lock, Globe, X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export function MeetingActions() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  
  // Create Meeting State
  const [step, setStep] = useState<1 | 2>(1);
  const [meetingName, setMeetingName] = useState("");
  const [datetime, setDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [meetingType, setMeetingType] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [enableAi, setEnableAi] = useState(true);
  
  // Generated Details State
  const [generatedId, setGeneratedId] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Set default datetime to now, and end time to 1 hour later
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    // eslint-disable-next-line
    setDatetime(now.toISOString().slice(0, 16));
    
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setEndDatetime(later.toISOString().slice(0, 16));
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      router.push(`/room/${joinId.trim()}`);
    }
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAddEmail = (e?: React.KeyboardEvent | React.FocusEvent) => {
    if (e) e.preventDefault();
    const emailsToAdd = emailInput.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    const validEmails = emailsToAdd.filter(e => validateEmail(e) && !invitedEmails.includes(e));
    if (validEmails.length > 0) {
      setInvitedEmails(prev => [...prev, ...validEmails]);
    }
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emailsToAdd = text.split(/[\n,]/).map(e => e.trim().toLowerCase()).filter(e => e);
      const validEmails = emailsToAdd.filter(e => validateEmail(e) && !invitedEmails.includes(e));
      if (validEmails.length > 0) {
        setInvitedEmails(prev => [...prev, ...validEmails]);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 9);
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: randomId,
          title: meetingName,
          scheduledFor: datetime,
          endTime: endDatetime,
          capacity: capacity,
          meetingType: meetingType,
          invitedEmails: invitedEmails,
          isAiEnabled: enableAi
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create meeting');
      }

      setGeneratedId(randomId);
      setStep(2);
    } catch (error: unknown) {
      console.error(error);
      alert(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure you have run the database migrations.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartNow = () => {
    router.push(`/room/${generatedId}?name=${encodeURIComponent(meetingName)}&ai=${enableAi}`);
  };

  const copyToClipboard = (text: string, type: 'id' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getFullLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/room/${generatedId}`;
    }
    return `https://ai-meet.app/room/${generatedId}`;
  };

  return (
    <Card className="bg-white border-zinc-200 shadow-xl shadow-indigo-900/5 rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardHeader className="bg-zinc-50/80 border-b border-zinc-100 pb-5">
        <CardTitle className="text-xl text-zinc-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* CREATE MEETING DIALOG */}
        <Dialog onOpenChange={(isOpen) => { if (!isOpen) setStep(1); }}>
          <DialogTrigger 
            render={
              <Button className="w-full justify-start gap-3 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_4_15px_rgba(79,70,229,0.2)] transition-all">
                <Plus className="w-5 h-5" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold">Schedule / Create Meeting</span>
                  <span className="text-xs text-indigo-200 font-normal">Generate links & configure AI</span>
                </div>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md bg-white border border-zinc-200 text-zinc-900 shadow-xl">
            
            {step === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2 text-zinc-900">
                    <Video className="w-6 h-6 text-indigo-600" />
                    Meeting Details
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Configure your meeting options to generate a shareable link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerate} id="create-meeting-form" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingName" className="text-zinc-700">Meeting Topic (Optional)</Label>
                    <Input
                      id="meetingName"
                      placeholder="e.g. Q3 Roadmap Review"
                      value={meetingName}
                      onChange={(e) => setMeetingName(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-11 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-700 flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={datetime}
                        onChange={(e) => setDatetime(e.target.value)}
                        className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-700 flex items-center gap-1.5"><CalendarIcon className="w-4 h-4"/> End Time (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={endDatetime}
                        onChange={(e) => setEndDatetime(e.target.value)}
                        className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-700 flex items-center gap-1.5"><Users className="w-4 h-4"/> Capacity (Max 100)</Label>
                      <Input 
                        type="number"
                        min="2"
                        max="100"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full h-11 px-3 bg-zinc-50 border-zinc-200 text-zinc-900 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-zinc-700">Meeting Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => setMeetingType("PRIVATE")}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col gap-2 ${meetingType === "PRIVATE" ? 'bg-indigo-50 border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)]' : 'bg-zinc-50 border-zinc-200 hover:border-indigo-300'}`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-zinc-900"><Lock className={`w-4 h-4 ${meetingType === "PRIVATE" ? 'text-indigo-600' : 'text-zinc-400'}`} /> Private</div>
                        <p className="text-xs text-zinc-500">Only invited people can join. Waitroom enforced.</p>
                      </div>
                      <div 
                        onClick={() => setMeetingType("PUBLIC")}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col gap-2 ${meetingType === "PUBLIC" ? 'bg-indigo-50 border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)]' : 'bg-zinc-50 border-zinc-200 hover:border-indigo-300'}`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-zinc-900"><Globe className={`w-4 h-4 ${meetingType === "PUBLIC" ? 'text-indigo-600' : 'text-zinc-400'}`} /> Public</div>
                        <p className="text-xs text-zinc-500">Anyone with the link can request to join.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-zinc-700">Invited Participants (Required for Private)</Label>
                      <Label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                      </Label>
                    </div>
                    
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all min-h-[5rem] flex flex-wrap gap-2 items-start">
                      {invitedEmails.map(email => (
                        <div key={email} className="flex items-center gap-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium px-2 py-1.5 rounded-md shadow-sm">
                          {email}
                          <button type="button" onClick={() => handleRemoveEmail(email)} className="text-zinc-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <input 
                        type="text"
                        placeholder={invitedEmails.length === 0 ? "Type email and press Enter, or paste comma-separated emails..." : "Add another email..."}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                        onBlur={handleAddEmail}
                        className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 py-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-medium text-zinc-600">Meeting Features</h4>
                    
                    <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">AI Assistant & Transcriptions</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableAi} 
                        onChange={(e) => setEnableAi(e.target.checked)} 
                        className="w-5 h-5 accent-indigo-600 rounded border-zinc-300 bg-white"
                      />
                    </label>
                  </div>
                </form>
                <DialogFooter>
                  <Button disabled={isGenerating} type="submit" form="create-meeting-form" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                    {isGenerating ? <span className="flex items-center gap-2">Generating...</span> : "Generate Meeting Link"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                    Meeting Created!
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Your meeting is ready. Share these details with your participants.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-600 text-xs uppercase tracking-wider">Meeting Link</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={getFullLink()}
                        className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 rounded-xl truncate"
                      />
                      <Button 
                        onClick={() => copyToClipboard(getFullLink(), 'link')}
                        variant="outline" 
                        className="shrink-0 h-11 px-4 border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl"
                      >
                        {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-600 text-xs uppercase tracking-wider">Meeting ID (For joining manually)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={generatedId}
                        className="bg-zinc-50 border-zinc-200 text-indigo-600 font-mono text-lg font-bold h-11 rounded-xl text-center"
                      />
                      <Button 
                        onClick={() => copyToClipboard(generatedId, 'id')}
                        variant="outline" 
                        className="shrink-0 h-11 px-4 border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl"
                      >
                        {copiedId ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl">
                    Back to edit
                  </Button>
                  <Button onClick={handleStartNow} className="w-full sm:w-auto h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_4_15px_rgba(79,70,229,0.2)]">
                    Start Meeting Now
                  </Button>
                </DialogFooter>
              </>
            )}

          </DialogContent>
        </Dialog>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-zinc-500">Or join existing</span>
          </div>
        </div>

        {/* JOIN MEETING FORM */}
        <form onSubmit={handleJoin} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Paste Meeting ID or Link" 
              className="pl-9 h-12 bg-zinc-50 border-zinc-200 text-zinc-900 rounded-xl placeholder:text-zinc-400"
            />
          </div>
          <Button type="submit" disabled={!joinId.trim()} variant="outline" className="w-full h-12 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 disabled:opacity-50 shadow-sm">
            Join Meeting
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
