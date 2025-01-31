import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

//define a mutation function called createdChat
//args represents what data the function expects
    //the fuction always expects a title which will always be a string
//the handler represents the actual logic of the mutation
//ctx represents the context of the mutation
    //it allows us to get access to the features of convex such as 
        //ctx.db which allows us read, delete or insert data into the database
        //ctx.auth.getUserIdentity() which allows us to chech if the user is authenticated and get the authenticated user
//then the function get the authenticated user identity(ctx.auth.getUserIdentity()) and stores it in identity
//if the use is not authenticated, throw an authentication error
//the function uses the ctx.db.insert() method which takes two arguements 
    //the name of the databse table or collection and the schema (object) of the data to be inserted
//returns the ID of the chat
export const createdChat = mutation({
    args: {
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                throw new Error("Not authenticated");
            }
        
        
        const chat = await ctx.db.insert("chats", {
            title: args.title,
            userId: identity.subject,
            createdAt: Date.now(),
        });

        return chat;
    },
});

//this is a mutation to delete a chat that is handle on the server
//the function expects an id of the chat to be deleted and v.id (chats) ensures it the id of that specific chat 
//the  handler takes the ctx to ensure that the user is authenticated for this mutaion and if not it throws an error
//..
//if the id of the chat doesn't match the id of the logged in user then it throws an error
//then get all the messages and filter throw the messages where the chatId = args.id (the id of the chat to be deleted)
//once all the messages gave been deleted, then delete the chat itself by it id (args.id)
export const deleteChat = mutation({
    args: {
        id: v.id("chats")
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const chat = await ctx.db.get(args.id);
        
        if (!chat || chat.userId !== identity.subject) {
            throw new Error("Not authorized");
        }

        // delete all messages in chat
        const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", args.id))
        .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        //Delete the chat 
        await ctx.db.delete(args.id);
    }
})


export const listChats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const chats = await ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();

        return chats;
    },
});