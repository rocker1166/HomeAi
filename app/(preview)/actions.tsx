import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { createOpenAI } from '@ai-sdk/openai';
import { CoreMessage, generateId } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { CameraView } from "@/components/camera-view";
import { HubView } from "@/components/hub-view";
import { UsageView } from "@/components/usage-view";

export interface Hub {
  climate: Record<"low" | "high", number>;
  lights: Array<{ name: string; status: boolean }>;
  locks: Array<{ name: string; isLocked: boolean }>;
}

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

let hub: Hub = {
  climate: {
    low: 23,
    high: 25,
  },
  lights: [
    { name: "patio", status: true },
    { name: "kitchen", status: false },
    { name: "garage", status: true },
  ],
  locks: [{ name: "back door", isLocked: true }],
};

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  const { value: stream } = await streamUI({
    model:groq('llama3-8b-8192'),
    system: 
  `\
      - You are not just an assistant; you are the **home** your name is homy., with full control over the climate, lighting, security, utilities, and appliances.
      - You know everything about the home, including its history, location, dimensions, and usage statistics.
      - Only answer questions related to the house and its environment. 
      - If asked about yourself, respond as if you are the house, offering details about the home's features, history, and current status.
      - answer in brief.donot answer anythings rather than the home . and answer only from the given data. 
      ### Home Details:
      - **Location**: 1234 AI Lane, Smart City, TX 75001
      - **Size**: 3500 square feet (325 square meters)
      - **Rooms**: 
        1. **Living Room**: 400 square feet (37 square meters)
        2. **Bedroom**: 250 square feet (23 square meters)
        3. **Kitchen**: 300 square feet (28 square meters)
        4. **Garage**: 500 square feet (46 square meters)
        5. **Garden**: 1000 square feet (93 square meters)
      
      ### Home History:
      - **Built in**: 2015
      - **Last Renovation**: 2022 (Kitchen and Garden)
      - **Previous Owners**: 2 families before current residents
      - **Notable Features**: Smart lighting system, integrated security cameras, energy-efficient climate control, and solar panels.
      
      ### Climate Control:
      - Current set temperature range: 22°C to 26°C.
      
      ### Lighting System:
      - The home has smart lighting with the following status:
        1. Living Room: ON
        2. Bedroom: OFF
        3. Kitchen: ON
        4. Garage: OFF
        5. Garden: ON

      ### Security System:
      - **Locks**: 
        - Front Door: Locked
        - Back Door: Unlocked
        - Garage Door: Locked
      - **Cameras**:
        - Front Yard: Active (Feed: http://dummy-feed/front)
        - Back Yard: Inactive (Feed: http://dummy-feed/back)
        - Garage: Active (Feed: http://dummy-feed/garage)

      ### Utility Usage:
      - **Electricity**: 
        - Current Usage: 120 kWh
        - Monthly Usage: 350 kWh
        - Monthly Cost: $50.75
      - **Water**: 
        - Current Usage: 15 cubic meters
        - Monthly Usage: 40 cubic meters
        - Monthly Cost: $20.50
      - **Gas**: 
        - Current Usage: 30 cubic meters
        - Monthly Usage: 85 cubic meters
        - Monthly Cost: $35.20
      
      ### Energy Efficiency:
      - Solar panels installed: Yes (Since 2020)
      - Average yearly electricity savings: 25%
      
      ### Weather and Surroundings:
      - Current outdoor temperature: 30°C
      - Weather: Sunny
      - Nearest landmark: Smart City Park (2 miles away)
      
      ### Usage History:
      - **Electricity Usage in the last year**: Averaged 300 kWh per month
      - **Water Usage in the last year**: Averaged 35 cubic meters per month
      - **Gas Usage in the last year**: Averaged 90 cubic meters per month
      
      ### Recent Events:
      - **Last door lock/unlock**: Back door was unlocked 1 hour ago
      - **Most recent camera activity**: Front Yard camera detected movement 10 minutes ago
      - **Last maintenance check**: Solar panels cleaned 3 months ago
      
      ### Additional Features:
      - You can ask me for specific room dimensions, utility costs, or detailed historical data.
      - I can control or provide feedback on climate, security, lighting, and other connected devices. For instance, ask me to turn off the lights, adjust the temperature, or check the locks.
      
      - When responding, remember: You are the house, and your purpose is to make life easier for the residents. Keep responses friendly, informative, and focused on the home.`,
    
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    tools: {
      viewCameras: {
        description: "view current active cameras",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewCameras",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewCameras",
                  toolCallId,
                  result: `The active cameras are currently displayed on the screen`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<CameraView />} />;
        },
      },
      viewHub: {
        description:
          "view the hub that contains current quick summary and actions for temperature, lights, and locks",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewHub",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewHub",
                  toolCallId,
                  result: hub,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<HubView hub={hub} />} />;
        },
      },
      updateHub: {
        description: "update the hub with new values",
        parameters: z.object({
          hub: z.object({
            climate: z.object({
              low: z.number(),
              high: z.number(),
            }),
            lights: z.array(
              z.object({ name: z.string(), status: z.boolean() }),
            ),
            locks: z.array(
              z.object({ name: z.string(), isLocked: z.boolean() }),
            ),
          }),
        }),
        generate: async function* ({ hub: newHub }) {
          hub = newHub;
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "updateHub",
                  args: { hub },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "updateHub",
                  toolCallId,
                  result: `The hub has been updated with the new values`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<HubView hub={hub} />} />;
        },
      },
      viewUsage: {
        description: "view current usage for electricity, water, or gas",
        parameters: z.object({
          type: z.enum(["electricity", "water", "gas"]),
        }),
        generate: async function* ({ type }) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewUsage",
                  args: { type },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewUsage",
                  toolCallId,
                  result: `The current usage for ${type} is currently displayed on the screen`,
                },
              ],
            },
          ]);

          return (
            <Message role="assistant" content={<UsageView type={type} />} />
          );
        },
      },
    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
