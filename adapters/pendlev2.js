const apiServer = "https://api-v2.pendle.finance/core";

export async function updateYield(yieldData) {
  const { chain, contractAddress } = yieldData; // Extract chainId and address from yieldData
  const marketDataEndpoint = `/v2/${chain.chainId}/markets/${contractAddress}/data`;
  const apyHistoryEndpoint = `/v1/${chain.chainId}/markets/${contractAddress}/apy-history`;

  try {
    // Fetch market data
    const response = await fetch(apiServer + marketDataEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add any other headers required by the API
      },
    });

    if (!response.ok) {
      throw new Error("Error:", response.statusText);
    }

    const responseData = await response.json();

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
    const timestampStart = threeMonthsAgo.toISOString();
    const timestampEnd = new Date().toISOString();

    const apyHistoryParams = new URLSearchParams({
      time_frame: "day",
      timestamp_start: timestampStart,
      timestamp_end: timestampEnd,
    });

    // Fetch historical APY data
    const apyHistoryResponse = await fetch(
      apiServer + apyHistoryEndpoint + "?" + apyHistoryParams.toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any other headers required by the API
        },
      }
    );

    if (!apyHistoryResponse.ok) {
      throw new Error("Error:", apyHistoryResponse.statusText);
    }

    const apyHistoryData = await apyHistoryResponse.json();

    // Update the yield data with the fetched market data
    yieldData.tvl = responseData.liquidity.usd; // Update TVL with USD liquidity
    yieldData.apy.value = responseData.impliedApy; // Update APY with Pendle APY

    // Add historical APY data to yield data
    yieldData.apy.history = apyHistoryData.results.map((result) => ({
      timestamp: result.timestamp,
      apy: result.impliedApy,
    }));

    return yieldData; // Return the updated yield data
  } catch (error) {
    console.error("Error:", error);
    return yieldData; // Return the original yield data in case of error
  }
}
