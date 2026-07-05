import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Settings, ShieldAlert } from "lucide-react";
import { PastMeetings } from "@/components/dashboard/past-meetings";
import { MeetingActions } from "@/components/dashboard/meeting-actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Handle query params synchronously by awaiting them
  const params = await searchParams;
  const errorMsg = params?.error;

  // Get user initial for avatar
  const initial = user.email?.charAt(0).toUpperCase() || "U";
  const name = user.email?.split('@')[0] || "User";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-indigo-500/30 relative">
      {/* Premium SaaS Dot Pattern Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />
      
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl shadow-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20 text-white">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Good evening, {name}</h1>
              <p className="text-zinc-500 text-sm">Ready for your next great idea?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-full shadow-sm">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </form>
          </div>
        </header>

        {/* Navigation Hint */}
        <div className="flex justify-center mb-6 text-zinc-500 text-sm font-medium animate-pulse">
           ← Swipe horizontally to switch between Actions and History →
        </div>

        {/* Horizontal scroll layout */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 px-4 -mx-4 custom-scrollbar items-start">
          {/* Main Action Pane */}
          <div className="snap-center shrink-0 w-full md:w-[500px] lg:w-[450px] space-y-6 pt-1">
            <MeetingActions />
          </div>

          {/* History Pane */}
          <div className="snap-center shrink-0 w-full md:w-[700px] lg:w-[750px] space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 px-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Past Meetings & AI Summaries
            </h2>
            <PastMeetings />
          </div>
        </div>
      </div>
    </div>
  );
}
