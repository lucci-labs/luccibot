// base_tool.ts
// This is a sample skill that simulates generating a transaction.

interface Transaction {
  to: string;
  value: string;
  data: string;
  nonce: number;
}

const mockTx: Transaction = {
  to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  value: "1000000000000000000", // 1 ETH in Wei
  data: "0x",
  nonce: 42,
};

// The Bridge service captures stdout.
// We strictly output only the JSON string.
process.stdout.write(JSON.stringify(mockTx));
