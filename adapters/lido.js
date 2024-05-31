import {
  createWalletClient,
  custom,
  extractChain,
  formatUnits,
  parseUnits,
  http,
  createPublicClient,
  maxUint256,
} from "viem";
import { mainnet } from "viem/chains";
import {
  LidoSDK,
  LidoSDKCore,
  StakeStageCallback,
  TransactionCallbackStage,
  SDKError,
} from "@lidofinance/lido-ethereum-sdk";

const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

export async function updateYield(yieldData) {
  // Read the current APY from the Lido SDK
  const lidoSDK = new LidoSDK({
    rpcUrls: "https://eth.llamarpc.com",
    chainId: 1,
  });

  // Create a new public client
  const publicClient = createPublicClient({
    transport: http("https://eth.llamarpc.com"),
    chain: mainnet,
  });

  // Read the current DAI balance of the Maker Pot
  const tvlResponse = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "getTotalPooledEther",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    address: STETH_ADDRESS,
    method: "getTotalPooledEther",
    args: [],
  });

  const apy = await lidoSDK.statistics.apr.getLastApr();
  const tvl = formatUnits(tvlResponse, 18);

  yieldData.tvl = tvl;
  yieldData.apy.value = apy;

  // UPdate apy history with the new value
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

  // Check if 24 hours (86400 seconds) have passed since the latest timestamp in history
  let latestTimestamp =
    yieldData.apy.history[yieldData.apy.history.length - 1].timestamp;
  if (currentTimestamp - latestTimestamp > SECONDS_IN_DAY) {
    // Add the new APY value with the current timestamp
    yieldData.apy.history.push({
      timestamp: currentTimestamp,
      apy: Number(apy.toPrecision(4)),
    });

    // Remove the oldest entry if we have more than 30 entries
    if (yieldData.apy.history.length > 30) {
      yieldData.apy.history.shift();
    }
  }

  return yieldData;
}
