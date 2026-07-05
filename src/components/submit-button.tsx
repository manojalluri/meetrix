"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

export function SubmitButton({ 
  children, 
  className,
  form
}: { 
  children: ReactNode;
  className?: string;
  form?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      form={form}
      disabled={pending}
      className={className}
    >
      {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
      {children}
    </Button>
  );
}
