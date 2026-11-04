export const meterAbi = [
 {
  "type": "function",
  "name": "createService",
  "inputs": [
   {
    "name": "kind",
    "type": "uint8"
   },
   {
    "name": "price",
    "type": "uint96"
   },
   {
    "name": "name",
    "type": "string"
   }
  ],
  "outputs": [
   {
    "name": "id",
    "type": "uint256"
   }
  ],
  "stateMutability": "nonpayable"
 },
 {
  "type": "function",
  "name": "credits",
  "inputs": [
   {
    "name": "",
    "type": "address"
   }
  ],
  "outputs": [
   {
    "name": "",
    "type": "uint256"
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "deposit",
  "inputs": [
   {
    "name": "amount",
    "type": "uint256"
   }
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
 },
 {
  "type": "function",
  "name": "earnings",
  "inputs": [
   {
    "name": "",
    "type": "address"
   }
  ],
  "outputs": [
   {
    "name": "",
    "type": "uint256"
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "getService",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   }
  ],
  "outputs": [
   {
    "name": "service",
    "type": "tuple",
    "components": [
     {
      "name": "seller",
      "type": "address"
     },
     {
      "name": "kind",
      "type": "uint8"
     },
     {
      "name": "active",
      "type": "bool"
     },
     {
      "name": "price",
      "type": "uint96"
     },
     {
      "name": "name",
      "type": "string"
     }
    ]
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "pay",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   },
   {
    "name": "maxPrice",
    "type": "uint96"
   }
  ],
  "outputs": [
   {
    "name": "seed",
    "type": "bytes32"
   }
  ],
  "stateMutability": "nonpayable"
 },
 {
  "type": "function",
  "name": "serviceCount",
  "inputs": [],
  "outputs": [
   {
    "name": "count",
    "type": "uint256"
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "setServiceActive",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   },
   {
    "name": "active",
    "type": "bool"
   }
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
 },
 {
  "type": "function",
  "name": "totalCalls",
  "inputs": [],
  "outputs": [
   {
    "name": "",
    "type": "uint256"
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "usdc",
  "inputs": [],
  "outputs": [
   {
    "name": "",
    "type": "address"
   }
  ],
  "stateMutability": "view"
 },
 {
  "type": "function",
  "name": "withdrawCredits",
  "inputs": [
   {
    "name": "amount",
    "type": "uint256"
   }
  ],
  "outputs": [],
  "stateMutability": "nonpayable"
 },
 {
  "type": "function",
  "name": "withdrawEarnings",
  "inputs": [],
  "outputs": [],
  "stateMutability": "nonpayable"
 },
 {
  "type": "event",
  "name": "CreditsWithdrawn",
  "inputs": [
   {
    "name": "buyer",
    "type": "address",
    "indexed": true
   },
   {
    "name": "amount",
    "type": "uint256",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "event",
  "name": "Deposited",
  "inputs": [
   {
    "name": "buyer",
    "type": "address",
    "indexed": true
   },
   {
    "name": "amount",
    "type": "uint256",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "event",
  "name": "EarningsWithdrawn",
  "inputs": [
   {
    "name": "seller",
    "type": "address",
    "indexed": true
   },
   {
    "name": "amount",
    "type": "uint256",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "event",
  "name": "Paid",
  "inputs": [
   {
    "name": "id",
    "type": "uint256",
    "indexed": true
   },
   {
    "name": "buyer",
    "type": "address",
    "indexed": true
   },
   {
    "name": "seller",
    "type": "address",
    "indexed": true
   },
   {
    "name": "price",
    "type": "uint96",
    "indexed": false
   },
   {
    "name": "seed",
    "type": "bytes32",
    "indexed": false
   },
   {
    "name": "blockNumber",
    "type": "uint256",
    "indexed": false
   },
   {
    "name": "timestamp",
    "type": "uint256",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "event",
  "name": "ServiceCreated",
  "inputs": [
   {
    "name": "id",
    "type": "uint256",
    "indexed": true
   },
   {
    "name": "seller",
    "type": "address",
    "indexed": true
   },
   {
    "name": "kind",
    "type": "uint8",
    "indexed": false
   },
   {
    "name": "price",
    "type": "uint96",
    "indexed": false
   },
   {
    "name": "name",
    "type": "string",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "event",
  "name": "ServiceStatusChanged",
  "inputs": [
   {
    "name": "id",
    "type": "uint256",
    "indexed": true
   },
   {
    "name": "active",
    "type": "bool",
    "indexed": false
   }
  ],
  "anonymous": false
 },
 {
  "type": "error",
  "name": "InactiveService",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   }
  ]
 },
 {
  "type": "error",
  "name": "InsufficientCredits",
  "inputs": [
   {
    "name": "available",
    "type": "uint256"
   },
   {
    "name": "required",
    "type": "uint256"
   }
  ]
 },
 {
  "type": "error",
  "name": "InvalidNameLength",
  "inputs": [
   {
    "name": "length",
    "type": "uint256"
   }
  ]
 },
 {
  "type": "error",
  "name": "NoEarnings",
  "inputs": []
 },
 {
  "type": "error",
  "name": "NotSeller",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   },
   {
    "name": "caller",
    "type": "address"
   }
  ]
 },
 {
  "type": "error",
  "name": "PriceExceedsMaximum",
  "inputs": [
   {
    "name": "price",
    "type": "uint96"
   },
   {
    "name": "maximum",
    "type": "uint96"
   }
  ]
 },
 {
  "type": "error",
  "name": "ReentrancyGuardReentrantCall",
  "inputs": []
 },
 {
  "type": "error",
  "name": "SafeERC20FailedOperation",
  "inputs": [
   {
    "name": "token",
    "type": "address"
   }
  ]
 },
 {
  "type": "error",
  "name": "UnknownService",
  "inputs": [
   {
    "name": "id",
    "type": "uint256"
   }
  ]
 },
 {
  "type": "error",
  "name": "ZeroAddress",
  "inputs": []
 },
 {
  "type": "error",
  "name": "ZeroAmount",
  "inputs": []
 },
 {
  "type": "error",
  "name": "ZeroPrice",
  "inputs": []
 }
] as const
