"use client";

import { useEffect, useRef } from "react";
import { apiBaseUrl } from "@/lib/config";

export type EventType =
  | "CONNECTED"
  | "SUBMISSION_LOCK_CHANGED"
  | "ROUND_STATUS_CHANGED"
  | "ROUND_CHANGED"
  | "TIMELINE_CHANGED"
  | "TEAM_UPDATED"
  | "TOP_TEAMS_UPDATED"
  | "PANELS_CHANGED"
  | "CRITERIA_CHANGED"
  | "SCORES_UPDATED"
  | "SUBMISSION_UPDATED";

export interface AppServerEvent<T = any> {
  type: EventType;
  payload?: T;
  timestamp: string;
}

export type EventHandlers = Partial<
  Record<EventType | "ALL", (event: AppServerEvent) => void>
>;

/**
 * Hook to subscribe to the backend Server-Sent Events (SSE) stream.
 * Automatically handles reconnection, parses JSON messages, and dispatches to typed handlers.
 *
 * @param token JWT access token (from team, evaluator, or admin session)
 * @param handlers Map of event types to handler callbacks
 * @param enabled Whether the SSE connection should be active (defaults to true)
 */
export function useRealtimeEvents(
  token: string | null | undefined,
  handlers: EventHandlers,
  enabled: boolean = true,
) {
  const handlersRef = useRef<EventHandlers>(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !token || typeof window === "undefined") {
      return;
    }

    const streamUrl = `${apiBaseUrl}/events/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (messageEvent) => {
      try {
        const data: AppServerEvent = JSON.parse(messageEvent.data);
        const specificHandler = handlersRef.current[data.type];
        if (specificHandler) {
          specificHandler(data);
        }
        const catchAllHandler = handlersRef.current["ALL"];
        if (catchAllHandler) {
          catchAllHandler(data);
        }
      } catch (err) {
        console.warn("Failed to parse SSE event data:", err);
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically retries connections in modern browsers
    };

    return () => {
      eventSource.close();
    };
  }, [token, enabled]);
}

