import { redirect } from 'next/navigation';

export default function NewRoomPage() {
  const roomId = Math.random().toString(36).substring(2, 9);
  redirect(`/room/${roomId}`);
}
