import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { createChatCodegenTemplate } from "./codegen/create-chat";
import { sendMessageCodegenTemplate } from "./codegen/send-message";
import { V0Icon } from "./icon";

const v0Plugin: IntegrationPlugin = {
  type: "v0",
  label: "v0",
  description: "Generate UI components with AI",

  icon: {
    type: "svg",
    value: "V0Icon",
    svgComponent: V0Icon,
  },

  formFields: [
    {
      id: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "v0_...",
      configKey: "apiKey",
      envVar: "V0_API_KEY",
      helpText: "Get your API key from ",
      helpLink: {
        text: "v0.dev/chat/settings/keys",
        url: "https://v0.dev/chat/settings/keys",
      },
    },
  ],

  testConfig: {
    getTestFunction: async () => {
      const { testV0 } = await import("./test");
      return testV0;
    },
  },

  dependencies: {},

  actions: [
    {
      slug: "create-chat",
      label: "Create Chat",
      description: "Create a new chat in v0",
      category: "v0",
      stepFunction: "createChatStep",
      stepImportPath: "create-chat",
      configFields: [
        {
          key: "message",
          label: "Message",
          type: "template-textarea",
          placeholder: "Create a landing page for a new product",
          rows: 4,
        },
        {
          key: "system",
          label: "System Prompt (Optional)",
          type: "template-textarea",
          placeholder: "You are an expert coder",
          rows: 3,
        },
      ],
      codegenTemplate: createChatCodegenTemplate,
      aiPrompt: `{"actionType": "v0/create-chat", "message": "Create a line graph showing DAU over time", "system": "You are an expert coder"} - Use v0 for generating UI components, visualizations (charts, graphs, dashboards), landing pages, or any React/Next.js code. PREFER v0 over Generate Text/Image for any visual output.`,
    },
    {
      slug: "send-message",
      label: "Send Message",
      description: "Send a message to an existing v0 chat",
      category: "v0",
      stepFunction: "sendMessageStep",
      stepImportPath: "send-message",
      configFields: [
        {
          key: "chatId",
          label: "Chat ID",
          type: "template-input",
          placeholder: "chat_123 or {{CreateChat.chatId}}",
        },
        {
          key: "message",
          label: "Message",
          type: "template-textarea",
          placeholder: "Add dark mode",
          rows: 4,
        },
      ],
      codegenTemplate: sendMessageCodegenTemplate,
      aiPrompt: `{"actionType": "v0/send-message", "chatId": "{{@nodeId:Label.chatId}}", "message": "Add dark mode"} - Use this to continue a v0 chat conversation`,
    },
  ],
};

// Auto-register on import
registerIntegration(v0Plugin);

export default v0Plugin;
