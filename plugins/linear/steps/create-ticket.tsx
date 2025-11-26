import "server-only";

import { LinearClient } from "@linear/sdk";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateBadgeInput } from "@/components/ui/template-badge-input";
import { TemplateBadgeTextarea } from "@/components/ui/template-badge-textarea";
import { fetchCredentials } from "@/lib/credential-fetcher";
import { getErrorMessage } from "@/lib/utils";

type CreateTicketResult =
  | { success: true; id: string; url: string; title: string }
  | { success: false; error: string };

/**
 * Create Ticket Step
 * Creates a ticket/issue in Linear
 */
export async function createTicketStep(input: {
  integrationId?: string;
  ticketTitle: string;
  ticketDescription: string;
}): Promise<CreateTicketResult> {
  "use step";

  const credentials = input.integrationId
    ? await fetchCredentials(input.integrationId)
    : {};

  const apiKey = credentials.LINEAR_API_KEY;
  const teamId = credentials.LINEAR_TEAM_ID;

  if (!apiKey) {
    return {
      success: false,
      error:
        "LINEAR_API_KEY is not configured. Please add it in Project Integrations.",
    };
  }

  try {
    const linear = new LinearClient({ apiKey });

    let targetTeamId = teamId;
    if (!targetTeamId) {
      const teams = await linear.teams();
      const firstTeam = teams.nodes[0];
      if (!firstTeam) {
        return {
          success: false,
          error: "No teams found in Linear workspace",
        };
      }
      targetTeamId = firstTeam.id;
    }

    const issuePayload = await linear.createIssue({
      title: input.ticketTitle,
      description: input.ticketDescription,
      teamId: targetTeamId,
    });

    const issue = await issuePayload.issue;

    if (!issue) {
      return {
        success: false,
        error: "Failed to create issue",
      };
    }

    return {
      success: true,
      id: issue.id,
      url: issue.url,
      title: issue.title,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create ticket: ${getErrorMessage(error)}`,
    };
  }
}

/**
 * Create Ticket Config Fields Component
 * UI for configuring the create ticket action
 */
export function CreateTicketConfigFields({
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
        <Label className="ml-1" htmlFor="ticketTitle">
          Ticket Title
        </Label>
        <TemplateBadgeInput
          disabled={disabled}
          id="ticketTitle"
          onChange={(value) => onUpdateConfig("ticketTitle", value)}
          placeholder="Bug report or {{NodeName.title}}"
          value={(config?.ticketTitle as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="ticketDescription">
          Description
        </Label>
        <TemplateBadgeTextarea
          disabled={disabled}
          id="ticketDescription"
          onChange={(value) => onUpdateConfig("ticketDescription", value)}
          placeholder="Description. Use {{NodeName.field}} to insert data from previous nodes."
          rows={4}
          value={(config?.ticketDescription as string) || ""}
        />
      </div>
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="ticketPriority">
          Priority
        </Label>
        <Select
          disabled={disabled}
          onValueChange={(value) => onUpdateConfig("ticketPriority", value)}
          value={(config?.ticketPriority as string) || "2"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No Priority</SelectItem>
            <SelectItem value="1">Urgent</SelectItem>
            <SelectItem value="2">High</SelectItem>
            <SelectItem value="3">Normal</SelectItem>
            <SelectItem value="4">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

