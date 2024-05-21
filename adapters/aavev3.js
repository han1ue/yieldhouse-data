import { AaveV3Ethereum, AaveV3Sepolia } from "@bgd-labs/aave-address-book"; // import specific pool

const aaveApiServer = "https://aave-api-v2.aave.com";

function getAddressBook(chainId) {
  const addressBooks = [AaveV3Ethereum, AaveV3Sepolia];
  return addressBooks.find((addressBook) => addressBook.CHAIN_ID === chainId);
}

export async function updateYield(yieldData) {
  const { chain, contractAddress } = yieldData;
  const addressBook = getAddressBook(chain.chainId);
  const marketsDataEndpoint = "/data/markets-data";
  const ratesHistoryEndpoint = "/data/rates-history"; // Example parameters
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
  const timestampStart = Math.floor(threeMonthsAgo.getTime() / 1000);

  const ratesHistoryParams = new URLSearchParams({
    reserveId:
      contractAddress + addressBook.POOL_ADDRESSES_PROVIDER + chain.chainId,
    from: timestampStart,
    resolutionInHours: "24",
  });

  try {
    // Fetch market data
    const marketsDataResponse = await fetch(
      aaveApiServer + marketsDataEndpoint,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any other headers required by the API
        },
      }
    );

    if (!marketsDataResponse.ok) {
      throw new Error("Error:", marketsDataResponse.statusText);
    }

    const marketsData = await marketsDataResponse.json();
    console.log("Markets Data:", marketsData);
    const market = marketsData.reserves.find(
      (reserve) =>
        reserve.id ==
        chain.chainId +
          "-" +
          contractAddress +
          "-" +
          addressBook.POOL_ADDRESSES_PROVIDER
    );
    console.log("Market:", market);

    const ratesHistoryResponse = await fetch(
      aaveApiServer +
        ratesHistoryEndpoint +
        "?" +
        ratesHistoryParams.toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any other headers required by the API
        },
      }
    );

    if (!ratesHistoryResponse.ok) {
      throw new Error("Error:", ratesHistoryResponse.statusText);
    }

    const ratesHistoryData = await ratesHistoryResponse.json();
    console.log("Rates History Data:", ratesHistoryData);

    // Update yieldData with fetched data
    yieldData.apy = market.liquidityRate;
    yieldData.tvl = market.totalLiquidityUSD;

    return yieldData; // Return the updated yield data
  } catch (error) {
    console.error("Error:", error);
    return yieldData; // Return the original yield data in case of error
  }
}
