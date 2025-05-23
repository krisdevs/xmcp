# Syntax details

## Define the schema for the tool properties

For readability, handle them outside the Tool Creation

const schema = z.object({
a: z.number(),
b: z.number(),
});

## Define the Tool Metadata

This includes the title, description, and annotations, and when built it will also add to the input schema the pre defined schema

export const metadata: ToolMetadata = {
title: "Add",
description: "Tool for adding two numbers",
annotations: { ... }
}

## Tool Signature

export default function Tool(arguments) {
// logic
}
