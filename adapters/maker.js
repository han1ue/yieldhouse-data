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

const RAY = BigInt("1000000000000000000000000000"); // 1e27 as a BigInt
const MAKER_POT_ADDRESS = "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7";
const SECONDS_PER_YEAR = BigInt(31536000);

export async function updateYield(yieldData) {
  // Create a new public client
  const publicClient = createPublicClient({
    transport: http("https://eth.llamarpc.com"),
    chain: mainnet,
  });

  // Read the current DAI balance of the Maker Pot
  const dsrResponse = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "dsr",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    address: MAKER_POT_ADDRESS,
    method: "dsr",
    args: [],
  });

  const dsrPerSecond = Number(dsrResponse) / Number(RAY);

  // Calculate APY using floating point arithmetic
  const apy = Math.pow(dsrPerSecond, Number(SECONDS_PER_YEAR)) - 1;

  console.log("apy", apy);

  // Read the current DAI balance of the Maker Pot
  const pieResponse = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "Pie",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    address: MAKER_POT_ADDRESS,
    method: "Pie",
    args: [],
  });

  const tvl = formatUnits(pieResponse, 18);

  console.log("tvl", tvl);

  yieldData.tvl = tvl;
  yieldData.apy.value = apy;

  return yieldData;
}
