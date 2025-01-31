import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
    END,
    MemorySaver,
    MessagesAnnotation,
    START,
    StateGraph
} from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import { 
    ChatPromptTemplate,
    MessagesPlaceholder
} from "@langchain/core/prompts";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, trimMessages } from "@langchain/core/messages";

// **Trims messages to manage conversation history**
const trimmer = trimMessages({
    maxTokens: 10,
    strategy: "last",
    tokenCounter: (msg) => msg.length,
    includeSystem: true,
    allowPartial: false,
    startOn: "human"
});

// **Initialize the tool client**
const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_APIKEY,
});

/**
 * **Initializes the AI model and binds tools to it.**
 * - Model: `gpt-4o-mini`
 * - `temperature`: Controls randomness (higher = more creative)
 * - `maxTokens`: Maximum tokens allowed in response
 * - `streaming`: Enables real-time response
 * - **Tools:** Allows model to use external tools for task execution
 * 
 * @returns {Promise<ChatOpenAI>} The initialized AI model with tools bound.
 */
const initialiseModel = async () => {
    const tools = await toolClient.lcTools;  // ✅ Await inside function, no top-level await
    const toolNode = new ToolNode(tools);

    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 4096,
        streaming: true,
    }).bindTools(tools);

    return model;
};

/**
 * **Determines whether the AI conversation should continue**
 * - If the last message is a **tool call**, the agent routes to `"tools"` node.
 * - If the last message is a **tool message**, it returns to `"agent"`.
 * - If neither, the conversation **ends**.
 * 
 * @param {typeof MessagesAnnotation.State} state - The current conversation state.
 * @returns {"tools" | "agent" | END} Next step in conversation flow.
 */
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    if (lastMessage.tool_calls?.length) return "tools";
    if (lastMessage.content && lastMessage._getType() === "tool") return "agent";
    return END;
}

/**
 * **Creates the AI conversation workflow using `StateGraph`.**
 * - `agent` node: Generates AI responses.
 * - `tools` node: Executes external tools.
 * - **Conditional routing:** Determines if conversation should continue.
 * 
 * @returns {Promise<StateGraph>} The configured workflow graph.
 */
const createWorkflow = async () => {
    const model = await initialiseModel();  // ✅ Await the initialized model
    const tools = await toolClient.lcTools;  // ✅ Await tool initialization

    const stateGraph = new StateGraph(MessagesAnnotation)
        .addNode("agent", async (state) => {
            const systemContent = SYSTEM_MESSAGE;

            // **Create the prompt template with system & message placeholders**
            const promptTemplate = ChatPromptTemplate.fromMessages([
                new SystemMessage(systemContent, {
                    cache_control: { type: "ephemeral" },
                }),
                new MessagesPlaceholder("messages")  // ✅ Fixed placeholder name
            ]);

            // **Trim messages to manage conversation history**
            const trimmedMessages = await trimmer.invoke(state.messages);

            // **Format prompt with conversation history**
            const prompt = await promptTemplate.invoke({
                messages: trimmedMessages
            });

            // **Invoke AI model for response**
            const response = await model.invoke(prompt);

            console.log("🤖 Model response:", response);
            return { messages: [response] };

            return { messages: [response] };
        })
        .addEdge(START, "agent")
        .addNode("tools", new ToolNode(tools))  // ✅ Ensured proper tool binding
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent");  // **Allows tool-agent transition**

    return stateGraph;
};

/**
 * **Adds caching headers to AI messages**
 * - Caches the **last** message to improve performance.
 * - Also caches the **second-to-last human message** (if available).
 * 
 * @param {BaseMessage[]} messages - Array of AI conversation messages.
 * @returns {BaseMessage[]} Updated messages with cache control.
 */
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
    if (!messages.length) return messages;
  
    const cachedMessages = [...messages];  // **Copy messages to avoid mutation**
  
    // **Helper function to add cache control**
    const addCache = (message: BaseMessage) => {
      message.content = [
        {
          type: "text",
          text: message.content as string,
          cache_control: { type: "ephemeral" },
        },
      ];
    };
  
    // **Cache the last message**
    addCache(cachedMessages.at(-1)!);
  
    // **Find and cache the second-to-last human message**
    let humanCount = 0;
    for (let i = cachedMessages.length - 1; i >= 0; i--) {
      if (cachedMessages[i] instanceof HumanMessage) {
        humanCount++;
        if (humanCount === 2) {
          addCache(cachedMessages[i]);
          break;
        }
      }
    }
  
    return cachedMessages;
}

/**
 * **Submits a question to the AI and streams the response.**
 * - Processes conversation history.
 * - Creates and executes the conversation workflow.
 * - Uses a **memory-saving mechanism** to store the conversation state.
 * 
 * @param {BaseMessage[]} messages - Chat history.
 * @param {string} chatId - Unique chat session ID.
 * @returns {Promise<any>} A stream of AI responses.
 */
export async function submitQuestion(messages: BaseMessage[], chatId: string) {
    // **Add caching headers for better efficiency**
    const cachedMessages = addCachingHeaders(messages);
    console.log("Messages: ", messages);    

    const workflow = await createWorkflow();  // ✅ Await workflow initialization

    // **Create memory checkpoint for conversation state**
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });

    // **Run the workflow and stream AI responses**
    const stream = await app.streamEvents(
        { messages: cachedMessages },
        {
            version: "v2",
            configurable: { thread_id: chatId },
            streamMode: "messages",
            runId: chatId
        }
    );

    return stream;
}
