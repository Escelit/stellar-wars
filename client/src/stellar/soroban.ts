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
    fee: '100',
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
    .setTimeout(30)
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
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE.TESTNET,
    })
      .setTimeout(30)
      .build(),
    simulation
  ).build();
}

/**
 * Sends a signed transaction and waits for it to be included in a ledger
 */
export async function sendContractCall(signedXdr: string) {
  const tx = new Transaction(signedXdr, NETWORK_PASSPHRASE.TESTNET);
  const response = await rpcServer.sendTransaction(tx);

  if (response.status !== 'PENDING') {
    throw new Error(`Transaction submission failed: ${response.status}`);
  }

  const txHash = response.hash;

  // Poll for result
  let status: string = response.status;
  let txResult;
  
  while (status === 'PENDING' || (txResult && txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND)) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    txResult = await rpcServer.getTransaction(txHash);
    status = txResult.status;
  }

  if (txResult && txResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status: ${txResult.status}`);
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
