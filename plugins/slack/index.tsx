import type { IntegrationPlugin } from "../registry";
import { registerIntegration } from "../registry";
import { sendSlackMessageCodegenTemplate } from "./codegen/send-slack-message";

const slackPlugin: IntegrationPlugin = {
  type: "slack",
  label: "Slack",
  description: "Send messages to Slack channels",

  icon: {
    type: "image",
    value: "/integrations/slack.svg",
  },

  formFields: [
    {
      id: "apiKey",
      label: "Bot Token",
      type: "password",
      placeholder: "xoxb-...",
      configKey: "apiKey",
      envVar: "SLACK_API_KEY",
      helpText: "Create a Slack app and get your Bot Token from ",
      helpLink: {
        text: "api.slack.com/apps",
        url: "https://api.slack.com/apps",
      },
    },
  ],

  testConfig: {
    getTestFunction: async () => {
      const { testSlack } = await import("./test");
      return testSlack;
    },
  },

  dependencies: {
    "@slack/web-api": "^7.12.0",
  },

  actions: [
    {
      slug: "send-message",
      label: "Send Slack Message",
      description: "Send a message to a Slack channel",
      category: "Slack",
      stepFunction: "sendSlackMessageStep",
      stepImportPath: "send-slack-message",
      configFields: [
        {
          key: "slackChannel",
          label: "Channel",
          type: "text",
          placeholder: "#general or {{NodeName.channel}}",
        },
        {
          key: "slackMessage",
          label: "Message",
          type: "template-textarea",
          placeholder:
            "Your message. Use {{NodeName.field}} to insert data from previous nodes.",
          rows: 4,
        },
      ],
      codegenTemplate: sendSlackMessageCodegenTemplate,
      aiPrompt: `{"actionType": "slack/send-message", "slackChannel": "#general", "slackMessage": "Message"}`,
    },
  ],
};

// Auto-register on import
registerIntegration(slackPlugin);

export default slackPlugin;
