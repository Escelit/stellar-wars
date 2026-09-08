import {
  rpc,
  TransactionBuilder,
  Address,
  scValToNative,
  xdr,
  Transaction,
  Operation,
} from '@stellar/stellar-sdk';
import { SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from './config';

const rpcServer = new rpc.Server(SOROBAN_RPC_URL.TESTNET);

const DEFAULT_FEE = '100';
const SIMULATION_TIMEOUT = 30;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 20;

export interface ContractCallParams {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  source: string;
}

/**
 * Simulates a contract call to get the result and resource usage
 */
export async function simulateContractCall({
  contractId,
  method,
  args = [],
  source,
}: ContractCallParams) {
  const account = await rpcServer.getAccount(source);
  
  const tx = new TransactionBuilder(account, {
    fee: DEFAULT_FEE,
    networkPassphrase: NETWORK_PASSPHRASE.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(contractId).toScAddress(),
            functionName: method,
            args: args,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(SIMULATION_TIMEOUT)
    .build();

  const simulation = await rpcServer.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  return simulation;
}

/**
 * Builds a transaction from a simulation result
 */
export async function buildTransaction(
  source: string,
  simulation: rpc.Api.SimulateTransactionResponse
) {
  const account = await rpcServer.getAccount(source);
  return rpc.assembleTransaction(
    new TransactionBuilder(account, {
      fee: DEFAULT_FEE,
      networkPassphrase: NETWORK_PASSPHRASE.TESTNET,
    })
      .setTimeout(SIMULATION_TIMEOUT)
      .build(),
    simulation
  ).build();
}

/**
 * Sends a signed transaction and waits for it to be included in a ledger.
 *
 * Polling is bounded by POLL_MAX_ATTEMPTS so a transaction that is stuck in
 * PENDING/NOT_FOUND forever fails with a clear error instead of hanging the
 * caller indefinitely.
 */
export async function sendContractCall(signedXdr: string) {
  const tx = new Transaction(signedXdr, NETWORK_PASSPHRASE.TESTNET);
  const response = await rpcServer.sendTransaction(tx);

  if (response.status !== 'PENDING') {
    throw new Error(`Transaction submission failed: ${response.status}`);
  }

  const txHash = response.hash;

  let txResult: rpc.Api.GetTransactionResponse | null = null;
  let attempts = 0;

  while (attempts < POLL_MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    txResult = await rpcServer.getTransaction(txHash);
    attempts += 1;

    if (txResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      break;
    }
    if (txResult.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed with status: ${txResult.status}`);
    }
  }

  if (!txResult || txResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(
      `Timed out waiting for transaction ${txHash} to be confirmed within ${POLL_MAX_ATTEMPTS} polls (${POLL_INTERVAL_MS}ms interval)`
    );
  }

  return { hash: txHash, result: txResult };
}

/**
 * Parses the result of a contract call into a native JavaScript value
 */
export function parseContractResult(result: rpc.Api.GetTransactionResponse) {
  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS || !result.returnValue) {
    return null;
  }
  return scValToNative(result.returnValue);
}
