# Tools - Syntax details

## Creating a Tool

Each tool is a TypeScript file with three exports:

### 1. Schema (Required)

```typescript
export const schema = {
  paramName: z.type().describe("Parameter description"),
};
```

### 2. Metadata (Required)

```typescript
export const metadata = {
  name: "toolName",
  description: "What the tool does",
  annotations: {
    title: "Display Name",
    readOnlyHint: true, // doesn't modify state
    destructiveHint: false, // safe operation
    idempotentHint: true, // same result on repeat
  },
};
```

### 3. Implementation (Required)

```typescript
export default async function toolName({ param }: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: "result" }],
  };
}
```

## Example

See `add.ts` for a complete working example.

Tools are automatically discovered and registered from this directory.
