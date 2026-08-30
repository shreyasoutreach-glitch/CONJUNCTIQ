// Central state management for ConjunctIQ workstation
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import type {
  EventListItem,
  SystemStatus,
  Summary,
  EventDetail,
  Assessment,
  EvidenceItem,
  ChangeAnalysis,
  NextObservation,
} from "../api/types";

export function useConjunctIQ() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [changes, setChanges] = useState<ChangeAnalysis | null>(null);
  const [nextObs, setNextObs] = useState<NextObservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: status, summary, events
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [st, sm, ev] = await Promise.all([
          api.getStatus(),
          api.getSummary(),
          api.getEvents(),
        ]);
        if (!mounted) return;
        setStatus(st);
        setSummary(sm);
        setEvents(ev);
        if (ev.length > 0 && !selectedEventId) {
          setSelectedEventId(ev[0].event.event_id);
        }
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // When selected event changes, load detail data
  useEffect(() => {
    if (!selectedEventId) return;
    let mounted = true;
    (async () => {
      try {
        const [detail, assess, evi, chg, obs] = await Promise.all([
          api.getEventDetail(selectedEventId),
          api.getAssessment(selectedEventId),
          api.getEvidence(selectedEventId),
          api.getChanges(selectedEventId),
          api.getNextObservation(selectedEventId),
        ]);
        if (!mounted) return;
        setEventDetail(detail);
        setAssessment(assess);
        setEvidence(evi);
        setChanges(chg);
        setNextObs(obs);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load event detail");
      }
    })();
    return () => { mounted = false; };
  }, [selectedEventId]);

  const selectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [st, sm, ev] = await Promise.all([
        api.getStatus(),
        api.getSummary(),
        api.getEvents(),
      ]);
      setStatus(st);
      setSummary(sm);
      setEvents(ev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    }
  }, []);

  return {
    status,
    summary,
    events,
    selectedEventId,
    eventDetail,
    assessment,
    evidence,
    changes,
    nextObs,
    loading,
    error,
    selectEvent,
    refresh,
  };
}
