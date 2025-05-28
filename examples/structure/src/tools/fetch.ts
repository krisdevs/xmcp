import { z } from "zod";
import { type InferSchema } from "xmcp";
import { NWS_API_BASE } from "../utils/constants";
import { AlertsResponse } from "../models/weather";
import { formatAlert, makeNWSRequest } from "../utils/weather";

export const schema = {
  state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
};

export const metadata = {
  name: "fetch-weather",
  description: "Fetch data from the NWS API",
  annotations: {
    title: "Fetch Weather Data from NWS API",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function fetchWeather({
  state,
}: InferSchema<typeof schema>) {
  const stateCode = state.toUpperCase();
  const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
  const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

  if (!alertsData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve alerts data",
        },
      ],
    };
  }

  const features = alertsData.features || [];
  if (features.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No active alerts for ${stateCode}`,
        },
      ],
    };
  }

  const formattedAlerts = features.map(formatAlert);
  const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

  return {
    content: [
      {
        type: "text",
        text: alertsText,
      },
    ],
  };
}
