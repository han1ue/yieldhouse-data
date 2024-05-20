import {
  createWalletClient,
  createPublicClient,
  custom,
  extractChain,
  erc20Abi,
} from "viem";
import { mainnet, base, arbitrum, sepolia } from "viem/chains";
import { useWallets } from "@privy-io/react-auth";

const sdkServer = "https://api-v2.pendle.finance/sdk/api";
const apiServer = "https://api-v2.pendle.finance/core";
const pendleRouterV4 = "0x888888888889758F76e7103c6CbF23ABbF58F946";

export async function isDepositApproved(
  privyWallet,
  chainId,
  token,
  spender,
  amount
) {
  const publicClient = getPublicClient(
    chainId,
    await privyWallet.getEthereumProvider()
  );

  const allowance = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [privyWallet.address, pendleRouterV4],
  });

  console.log("allowance", allowance);
  console.log("amount", amount);

  return allowance >= amount;
}
