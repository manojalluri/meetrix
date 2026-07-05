import { signup } from "../login/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Video, AlertCircle } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-[128px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
              AI Meet
            </span>
          </Link>
        </div>

        <Card className="bg-white border-zinc-200 shadow-xl rounded-3xl p-2 text-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center text-zinc-500">
              Join the future of enterprise collaboration
            </CardDescription>
          </CardHeader>
          
          <form action={signup}>
            <CardContent className="space-y-4">
              {params.error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {params.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-700">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-12 rounded-xl"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <SubmitButton className="w-full h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-[0_4_15px_rgba(79,70,229,0.2)] transition-all">
                Sign Up
              </SubmitButton>
              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
