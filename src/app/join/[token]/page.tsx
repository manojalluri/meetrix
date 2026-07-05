import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/join/${token}`);
  }

  // Verify token
  const { data: invite, error } = await supabase
    .from('meeting_invitations')
    .select('*, meetings(*)')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center text-zinc-900 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
        <p className="text-zinc-600 mb-6">This invitation link is invalid or has expired.</p>
        <a href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Return to Dashboard</a>
      </div>
    );
  }

  // Prevent link sharing: Ensure logged-in user matches invitation email
  if (user.email !== invite.email) {
    // Log the incident conceptually
    console.warn(`[SECURITY] Shared Link Detected! User ${user.email} tried to use invite for ${invite.email}`);
    
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center text-zinc-900 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-zinc-600 text-center max-w-md mb-6">
          This invitation is only valid for <strong>{invite.email}</strong>.<br/><br/>
          You are logged in as {user.email}. Please switch accounts or request a new invitation.
        </p>
        <a href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Return to Dashboard</a>
      </div>
    );
  }
  
  redirect(`/room/${invite.meeting_id}?token=${token}`);
}
