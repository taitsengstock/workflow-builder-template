import "server-only";

import { db } from "@/lib/db";
import { workflowExecutions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ethers } from "ethers";
import { initializeParaSigner } from "@/lib/para/wallet-helpers";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
import { getErrorMessage } from "@/lib/utils";

type TransferFundsResult =
  | { success: true; transactionHash: string }
  | { success: false; error: string };

export type TransferFundsCoreInput = {
  amount: string;
  recipientAddress: string;
};

export type TransferFundsInput = StepInput & TransferFundsCoreInput;

/**
 * Get userId from executionId by querying the workflowExecutions table
 */
async function getUserIdFromExecution(
  executionId: string | undefined
): Promise<string> {
  if (!executionId) {
    throw new Error("Execution ID is required to get user ID");
  }

  const execution = await db
    .select({ userId: workflowExecutions.userId })
    .from(workflowExecutions)
    .where(eq(workflowExecutions.id, executionId))
    .limit(1);

  if (execution.length === 0) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  return execution[0].userId;
}

/**
 * Core transfer logic
 */
async function stepHandler(
  input: TransferFundsInput
): Promise<TransferFundsResult> {
  const { amount, recipientAddress, _context } = input;

  // Validate recipient address
  if (!ethers.isAddress(recipientAddress)) {
    return {
      success: false,
      error: `Invalid recipient address: ${recipientAddress}`,
    };
  }

  // Validate amount
  if (!amount || amount.trim() === "") {
    return {
      success: false,
      error: "Amount is required",
    };
  }

  let amountInWei: bigint;
  try {
    amountInWei = ethers.parseEther(amount);
  } catch (error) {
    return {
      success: false,
      error: `Invalid amount format: ${getErrorMessage(error)}`,
    };
  }

  // Get userId from executionId (passed via _context)
  if (!_context?.executionId) {
    return {
      success: false,
      error: "Execution ID is required to identify the user",
    };
  }

  let userId: string;
  try {
    userId = await getUserIdFromExecution(_context.executionId);
  } catch (error) {
    return {
      success: false,
      error: `Failed to get user ID: ${getErrorMessage(error)}`,
    };
  }

  // Sepolia testnet RPC URL
  // TODO: Make this configurable in the future
  const SEPOLIA_RPC_URL = "https://chain.techops.services/eth-sepolia";

  let signer;
  try {
    signer = await initializeParaSigner(userId, SEPOLIA_RPC_URL);
  } catch (error) {
    return {
      success: false,
      error: `Failed to initialize wallet: ${getErrorMessage(error)}`,
    };
  }

  // Send transaction
  try {
    const tx = await signer.sendTransaction({
      to: recipientAddress,
      value: amountInWei,
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      return {
        success: false,
        error: "Transaction sent but receipt not available",
      };
    }

    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    return {
      success: false,
      error: `Transaction failed: ${getErrorMessage(error)}`,
    };
  }
}

/**
 * Transfer Funds Step
 * Transfers ETH from the user's wallet to a recipient address
 */
export async function transferFundsStep(
  input: TransferFundsInput
): Promise<TransferFundsResult> {
  "use step";

  return withStepLogging(input, () => stepHandler(input));
}

export const _integrationType = "web3";

