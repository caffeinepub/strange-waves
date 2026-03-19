# Strange Waves

## Current State
Backend implements DIP-721 NFT standard with `supportedStandards()`, `dip721_name()`, `dip721_symbol()`, `dip721_total_supply()`, `dip721_metadata()`, `dip721_owner_token_identifiers()`, and `dip721_token_metadata()`. OISY and Plug cannot detect the collection because they primarily query for ICRC-7 (the newer ICP NFT standard) rather than DIP-721.

## Requested Changes (Diff)

### Add
- ICRC-7 types: `Account`, `Value`, `TransferArg`, `TransferResult`, `TransferError`
- `icrc7_collection_metadata()` — returns collection metadata as key-value pairs
- `icrc7_name()` — collection name
- `icrc7_symbol()` — collection symbol
- `icrc7_total_supply()` — total minted tokens
- `icrc7_owner_of(token_ids: [Nat])` — returns owner Account per token
- `icrc7_tokens_of(account: Account, prev: ?Nat, take: ?Nat)` — paginated token list for an account
- `icrc7_balance_of(accounts: [Account])` — count of tokens per account
- `icrc7_transfer(args: [TransferArg])` — ICRC-7 compliant transfer

### Modify
- `supportedStandards()` — also return ICRC-7 alongside DIP721

### Remove
- Nothing

## Implementation Plan
1. Add ICRC-7 type definitions to main.mo
2. Add all required ICRC-7 query and update methods
3. Update `supportedStandards()` to include ICRC-7
4. Regenerate backend bindings and update frontend IDL files
