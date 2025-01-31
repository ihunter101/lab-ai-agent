import { NavigationContext } from "@/lib/NavigationProvider";
import { Divide } from "lucide-react";
import { useRouter } from "next/navigation"
import { use } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ChatRow from "./ChatRow";

const SideBar = () => {

    const router = useRouter();
    const {closeMobileNav, isMobileNavOpen} = use(NavigationContext);

    const chats = useQuery(api.chats.listChats);
    const createChat = useMutation(api.chats.createdChat);
    const deleteChat = useMutation(api.chats.deleteChat);

    const handleClick = () =>{
        // router.push("/dashboard/chat");
        closeMobileNav();
    }

    //the createdchat() function in chats.ts returns the id of the new chat
    //the id of the chat is then stored in a variable called chatId
    //then that vairable is then passed to the params of the router.push() function
    const handleNewChat = async () => {
        const chatId = await createChat({title: "New Chat"});
        router.push(`/dashboard/chat/${chatId}`);
        closeMobileNav();
    }

/**
 * Deletes a chat with the specified id and redirects to the dashboard
 * if the current view is the chat being deleted.
 *
 * @param id - The identifier of the chat to be deleted.
 */

    const handleDeleteChat = async (id: Id<"chats">) => {
        await deleteChat({id});
        //if we are currently viewing this chat then redirect to the dahsboard 
        if (window.location.pathname.includes(id)) {
            router.push("/dashboard");
        }
    }
  return (
   <>
        {/* Background overlay for Mobiles */}
        {isMobileNavOpen && (
            <div
                className="fixed inset-0 bg-black/20 z-40 md:hidden"
                onClick={closeMobileNav}
            >

            </div>
        )}

        <div
            className={cn(
            "fixed md:inset-y-0 top-14 bottom-0 left-0 z-50 w-72 bg-gray-50/80 backdrop-blur-xl border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:top-0 flex flex-col",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
        <div className="p-4 border-b border-gray-200/50">
            <Button
                onClick={handleNewChat}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/50 shadow-sm hover:shadow transition-all duration-200"
            >
             <PlusIcon className="mr-2 h-4 w-4" /> New Chat
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 p-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {chats?.map((chat) => (
                <ChatRow key={chat._id} chat={chat} onDelete={handleDeleteChat} />
          ))}
        </div>
      </div>
   </>
  )
}

export default SideBar