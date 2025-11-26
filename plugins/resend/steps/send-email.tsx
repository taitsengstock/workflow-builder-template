import "server-only";

import { Resend } from "resend";
import { Label } from "@/components/ui/label";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Send Email Step
 * Sends an email using Resend
 */
export async function sendEmailStep(input: {
  integrationId?: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
}): Promise<SendEmailResult> {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  const apiKey = credentials.RESEND_API_KEY;
  const fromEmail = credentials.RESEND_FROM_EMAIL;

  if (!apiKey) {
    return {
      success: false,
      error:
        "RESEND_API_KEY is not configured. Please add it in Project Integrations.",
    };
  }

  if (!fromEmail) {
    return {
      success: false,
      error:
        "RESEND_FROM_EMAIL is not configured. Please add it in Project Integrations.",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: fromEmail,
      to: input.emailTo,
      subject: input.emailSubject,
      text: input.emailBody,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Failed to send email",
      };
    }

    return { success: true, id: result.data?.id || "" };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email: ${getErrorMessage(error)}`,
    };
  }
}

/**
 * Send Email Config Fields Component
 * UI for configuring the send email action
 */
export function SendEmailConfigFields({
  config,
  onUpdateConfig,
  disabled,
}: {
  config: Record<string, unknown>;
  onUpdateConfig: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailTo">
          To (Email Address)
        </Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="emailTo"
          onChange={(value) => onUpdateConfig("emailTo", value)}
          placeholder="user@example.com or {{NodeName.email}}"
          value={(config?.emailTo as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailSubject">
          Subject
        </Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="emailSubject"
          onChange={(value) => onUpdateConfig("emailSubject", value)}
          placeholder="Subject or {{NodeName.title}}"
          value={(config?.emailSubject as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="emailBody">
          Body
        </Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="emailBody"
          onChange={(value) => onUpdateConfig("emailBody", value)}
          placeholder="Email content or {{NodeName.description}}"
          rows={5}
          value={(config?.emailBody as string) || ""}
        />
      </div>
    </>
  );
}

