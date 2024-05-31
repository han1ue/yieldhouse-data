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
import { LidoSDK } from "@lidofinance/lido-ethereum-sdk";

const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const ETH_PRICE_ORACLE_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const SECONDS_IN_DAY = 86400;

export async function updateYield(yieldData) {
  // Read the current APY from the Lido SDK
  const lidoSDK = new LidoSDK({
    rpcUrls: ["https://gateway.tenderly.co/public/mainnet"],
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

  const ethPriceResponse = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "latestAnswer",
        outputs: [
          {
            internalType: "int256",
            name: "",
            type: "int256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    address: ETH_PRICE_ORACLE_ADDRESS,
    method: "latestAnswer",
  });

  const apy = (await lidoSDK.statistics.apr.getLastApr()) / 100;
  const tvl = formatUnits(tvlResponse, 18) * formatUnits(ethPriceResponse, 8);

  yieldData.tvl = tvl;
  yieldData.apy.value = apy;

  // UPdate apy history with the new value
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

  console.log("apy", apy);
  console.log("currentTimestamp", currentTimestamp);

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
