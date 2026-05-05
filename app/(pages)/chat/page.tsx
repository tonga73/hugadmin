import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ChatApp } from "./chat-app";

export default async function ChatPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!me) redirect("/login");

  const allUsers = await prisma.user.findMany({
    where: { active: true, visible: true },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });

  return <ChatApp meId={me.id} allUsers={allUsers} />;
}
