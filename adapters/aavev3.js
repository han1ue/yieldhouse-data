import {
  AaveV3Ethereum,
  AaveV3Sepolia,
  AaveV3Arbitrum,
  AaveV3Base,
} from "@bgd-labs/aave-address-book";

const aaveApiServer = "https://aave-api-v2.aave.com";
const threeMonthsInSecs = 60 * 60 * 24 * 30 * 3;

function getAddressBook(chainId) {
  const addressBooks = [
    AaveV3Ethereum,
    AaveV3Sepolia,
    AaveV3Arbitrum,
    AaveV3Base,
  ];
  return addressBooks.find((addressBook) => addressBook.CHAIN_ID === chainId);
}

export async function updateYield(yieldData) {
  const { chain, contractAddress } = yieldData;
  const addressBook = getAddressBook(chain.chainId);
  const marketsDataEndpoint = "/data/markets-data";
  const ratesHistoryEndpoint = "/data/rates-history"; // Example parameters;
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

  const ratesHistoryParams = new URLSearchParams({
    reserveId:
      contractAddress + addressBook.POOL_ADDRESSES_PROVIDER + chain.chainId,
    from: (currentTimestamp - threeMonthsInSecs).toString(),
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
    const reserveId =
      chain.chainId +
      "-" +
      contractAddress.toLowerCase() +
      "-" +
      addressBook.POOL_ADDRESSES_PROVIDER.toLowerCase();
    const market = marketsData.reserves.find(
      (reserve) => reserve.id == reserveId
    );

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

    // Update yieldData with fetched data
    yieldData.apy.value = market.liquidityRate;
    yieldData.apy.history = ratesHistoryData.map((result) => {
      const date = new Date(
        result.x.year,
        result.x.month,
        result.x.date,
        result.x.hours
      );

      return {
        timestamp: Math.floor(date.getTime() / 1000),
        apy: result.liquidityRate_avg,
      };
    });
    yieldData.tvl = market.totalLiquidityUSD;

    return yieldData; // Return the updated yield data
  } catch (error) {
    console.error("Error:", error);
    return yieldData; // Return the original yield data in case of error
  }
}
