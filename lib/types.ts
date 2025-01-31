import { Id } from "@/convex/_generated/dataModel"


export const SSE_DATA_PREFIX = "data" as const;
export const SSE_LINE_DELIMITER = "\n\n" as const
;export const SSE_DONE_MESSAGE = "[DONE]" as const;


export type MessageRole = "user" | "agent";

// the Message interface tell typescript that any object of type message will always have 
//a message role (which is either user or agent) and a message content which is a string
export interface Message {
    role: MessageRole;
    content: string;
}

//the first property of the chat request is a message which will always be an array of messages denoted by [] symbol
    //each of which will have a role and a content as defined by the Message interface
//the second property is a new message which is a string representing a new message added to the chat
//
export interface ChatRequestBody {
    messages: Message[];
    newMessage: string;
    chatId: Id<"chats">;
}

//streamedMessageType has a six possible constant values that represent the different types of messages that can be sent
export enum StreamMessageType {
    Token = "token",
    Error = "error",
    Connected = "connected",
    Done = "done",
    ToolStart = "tool_start",
    ToolEnd = "tool_end",
}

//basestreammessage is a type of interface that define a stream message witha type property
//the type of stream message can enam values of StreamMessageType
export interface BaseStreamMessage {
    type: StreamMessageType;
}

//this defines the structer of a token message that has a property of token, and this token property is a type string
export interface TokenMessage extends BaseStreamMessage {
    type: StreamMessageType.Token;
    token: string;
}
 //this define the stucture od a  error stream message which has property of type of error and error of type string 
export interface ErrorMessage extends BaseStreamMessage {
    type: StreamMessageType.Error;
    error: string;
}

//this defines the structure of a connect stream message whcih is of type connected
export interface ConnectMessage extends BaseStreamMessage {
    type: StreamMessageType.Connected;
}

//this defines the strucutre of a done stream message which has a property which is of type done
export interface DoneMessage extends BaseStreamMessage {
    type: StreamMessageType.Done;
}

//this define the structure of tool start message which has thee property of type of tool,
//and tool which is a property of type string and an input property of type unknown 
export interface ToolStartMessage extends BaseStreamMessage {
    type: StreamMessageType.ToolStart;
    tool: string;
    input: unknown;
}

//this defines the structure of an end stream tool end message which has the property of tool end 
//and tool which is a property of type string and an output property of type unknown
export interface ToolEndMessage extends BaseStreamMessage {
    type: StreamMessageType.ToolEnd;
    tool: string;
    output: unknown;
}

//this is a formated custom type union that is a combination of all the possible stream message types

export type StreamMessage = 
    | TokenMessage
    | ErrorMessage
    | ConnectMessage
    | DoneMessage
    | ToolStartMessage
    | ToolEndMessage;