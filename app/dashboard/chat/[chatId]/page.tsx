import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import  ChatInterface  from "../../../../components/ChatInterface";

interface ChatPageParams {
    params: Promise<{
        chatId: Id<"chats">
    }>
}

async function ChatPage( { params }: ChatPageParams) {
    const { chatId } = await params;

    // get Authenticated user
    const {userId} = await auth();
    if (!userId) {
        redirect("/");
    }

    // Get convex and fetch chat and last messages 
    const convex = getConvexClient();

   try {
     // get Messages
     const initialMessages = await convex.query(api.messages.list, {chatId});
     return (
       <div className="flex-1 overflow-hidden">
            <ChatInterface chatId={chatId} initialMessages={initialMessages} />
       </div>
     );
   } catch (error) {
        console.error("Error loading chats", error);
        redirect("/dashboard");
   }
}

export default ChatPage