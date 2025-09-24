// Contract configuration for deployed stealth address contracts
export interface ContractConfig {
  address: string;
  network: string;
  rpcUrl: string;
  explorerUrl: string;
  status: 'deployed' | 'not_deployed';
  deploymentTx?: string;
  initTx?: string;
}

export interface ContractFunctions {
  initialize: string;
  registerStealthAddress: string;
  createStealthPayment: string;
  claimStealthPayment: string;
  deactivateStealthAddress: string;
  reactivateStealthAddress: string;
}

// Deployed testnet configuration
export const TESTNET_CONFIG: ContractConfig = {
  address: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c",
  network: "testnet",
  rpcUrl: "https://fullnode.testnet.aptoslabs.com/v1",
  explorerUrl: "https://explorer.aptoslabs.com/?network=testnet",
  status: "deployed",
  deploymentTx: "0x3efb342269d35a75ca47d64aebc5f750cd4f708cefb6258a7493a89da0cc3751",
  initTx: "0x8a74dc29d0d5becdeda05e01ea1f3188f397d258e74ac243330a3a01e3e3ac07"
};

// Contract function IDs for testnet
export const TESTNET_FUNCTIONS: ContractFunctions = {
  initialize: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::initialize",
  registerStealthAddress: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::register_stealth_address",
  createStealthPayment: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::create_stealth_payment",
  claimStealthPayment: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::claim_stealth_payment",
  deactivateStealthAddress: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::deactivate_stealth_address",
  reactivateStealthAddress: "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c::stealth_address::reactivate_stealth_address"
};

// Get current configuration based on environment
export function getContractConfig(): ContractConfig {
  const network = process.env.APTOS_NETWORK || 'testnet';
  
  switch (network) {
    case 'testnet':
      return TESTNET_CONFIG;
    case 'devnet':
      return {
        address: "",
        network: "devnet",
        rpcUrl: "https://fullnode.devnet.aptoslabs.com/v1",
        explorerUrl: "https://explorer.aptoslabs.com/?network=devnet",
        status: "not_deployed"
      };
    case 'mainnet':
      return {
        address: "",
        network: "mainnet",
        rpcUrl: "https://fullnode.mainnet.aptoslabs.com/v1",
        explorerUrl: "https://explorer.aptoslabs.com/?network=mainnet",
        status: "not_deployed"
      };
    default:
      return TESTNET_CONFIG;
  }
}

// Get contract functions based on current configuration
export function getContractFunctions(): ContractFunctions {
  const config = getContractConfig();
  
  if (config.status !== 'deployed') {
    throw new Error(`Contracts not deployed on ${config.network}`);
  }
  
  const address = config.address;
  return {
    initialize: `${address}::stealth_address::initialize`,
    registerStealthAddress: `${address}::stealth_address::register_stealth_address`,
    createStealthPayment: `${address}::stealth_address::create_stealth_payment`,
    claimStealthPayment: `${address}::stealth_address::claim_stealth_payment`,
    deactivateStealthAddress: `${address}::stealth_address::deactivate_stealth_address`,
    reactivateStealthAddress: `${address}::stealth_address::reactivate_stealth_address`
  };
}
