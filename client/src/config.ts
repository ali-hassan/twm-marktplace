import { Configuration } from "./twm-finance/config";
import { ChainId } from "./twm-finance/types";

const configurations: { [env: string]: Configuration } = {
  development: {
    chainId: ChainId.GOERLI,
    networkName: "Goerli Testnet",
    ethscanUrl: "https://goerli.etherscan.io/",
    defaultProvider:
      "https://eth-goerli.g.alchemy.com/v2/26t6Od2wqkhFyeYUyM9wUH1k9T-nMx_J",
    deployments: require("./twm-finance/deployments/deployments.testing.json"),
    refreshInterval: 10000,
    serverUrl: "http://localhost:5000/api/",
    casinoUrl: "http://localhost:5000/"
  },
  production: {
    chainId: ChainId.MAINNET,
    networkName: "Ethereum Mainnet",
    ethscanUrl: "https://etherscan.io/",
    defaultProvider:
      "https://eth-mainnet.g.alchemy.com/v2/26t6Od2wqkhFyeYUyM9wUH1k9T-nMx_J",
    deployments: require("./twm-finance/deployments/deployments.mainnet.json"),
    refreshInterval: 10000,
    serverUrl: "https://twm-backend.herokuapp.com/api/",
    casinoUrl: "https://twm-backend.herokuapp.com/"
  },
};

export default configurations[process.env.NODE_ENV || "development"];
