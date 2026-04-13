import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENT_DURATION_BUFFER_MS = 30 * 60 * 1000; // 30 min buffer

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const results = { transitioned_to_live: 0, transitioned_to_completed: 0, snapshots_created: 0, errors: [] as string[] };

    // Fetch all non-locked, non-archived events
    const { data: events, error: fetchErr } = await supabase
      .from("events")
      .select("*")
      .eq("is_locked", false)
      .neq("lifecycle_state", "archived");

    if (fetchErr) {
      throw new Error(`Failed to fetch events: ${fetchErr.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No events to process", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const event of events) {
      try {
        const startTime = new Date(event.event_date);
        const endTime = new Date(event.end_time);
        const bufferMs = EVENT_DURATION_BUFFER_MS + (event.overtime_minutes_added || 0) * 60 * 1000 + (event.delay_total_minutes || 0) * 60 * 1000;
        const bufferedEnd = new Date(endTime.getTime() + bufferMs);

        // Skip paused events
        if (event.is_paused) continue;

        // Skip events with active overtime (can't auto-complete)
        if (event.overtime_active) continue;

        // TRANSITION: upcoming/scheduled → live/active
        if (now >= startTime && now < bufferedEnd && event.lifecycle_state === "scheduled") {
          const { error } = await supabase
            .from("events")
            .update({
              status: "live",
              lifecycle_state: "active",
            } as any)
            .eq("id", event.id);

          if (error) {
            results.errors.push(`Failed to activate ${event.event_name}: ${error.message}`);
          } else {
            results.transitioned_to_live++;
            console.log(`✅ Event activated: ${event.event_name}`);
          }
        }

        // TRANSITION: live/active → completed/finalizing → archived
        if (now >= bufferedEnd && (event.lifecycle_state === "active" || event.lifecycle_state === "scheduled")) {
          // Finalize: lock, set completed, create snapshot
          const { error: updateErr } = await supabase
            .from("events")
            .update({
              status: "completed",
              lifecycle_state: "finalizing",
              is_locked: true,
              evacuation_mode: false,
            } as any)
            .eq("id", event.id);

          if (updateErr) {
            results.errors.push(`Failed to complete ${event.event_name}: ${updateErr.message}`);
            continue;
          }

          // Fetch peak data from attendance logs
          const { data: logs } = await supabase
            .from("attendance_logs")
            .select("*")
            .eq("event_id", event.id)
            .order("current_attendance", { ascending: false })
            .limit(1);

          const peakLog = logs?.[0];
          const { data: avgData } = await supabase
            .from("attendance_logs")
            .select("avg_wait_time, surge_risk_score")
            .eq("event_id", event.id);

          const avgWait = avgData && avgData.length > 0
            ? avgData.reduce((sum: number, l: any) => sum + (l.avg_wait_time || 0), 0) / avgData.length
            : 0;
          const peakSurge = avgData && avgData.length > 0
            ? Math.max(...avgData.map((l: any) => l.surge_risk_score || 0))
            : 0;

          // Create snapshot
          const { error: snapErr } = await supabase.from("event_snapshots").insert({
            event_id: event.id,
            final_attendance: event.current_attendance,
            peak_attendance: peakLog?.current_attendance || event.current_attendance,
            avg_wait_time: Math.round(avgWait * 10) / 10,
            peak_surge_risk: Math.round(peakSurge * 100) / 100,
            incident_count: 0,
            revenue_estimate: event.current_attendance * 850, // avg ticket price
          });

          if (snapErr) {
            results.errors.push(`Failed to create snapshot for ${event.event_name}: ${snapErr.message}`);
          } else {
            results.snapshots_created++;
          }

          // Archive
          await supabase
            .from("events")
            .update({ lifecycle_state: "archived" } as any)
            .eq("id", event.id);

          // Reset stadium crowd status
          await supabase
            .from("stadiums")
            .update({ crowd_status: "low" } as any)
            .eq("id", event.stadium_id);

          results.transitioned_to_completed++;
          console.log(`✅ Event completed & archived: ${event.event_name}`);
        }
      } catch (eventErr) {
        const msg = eventErr instanceof Error ? eventErr.message : "Unknown error";
        results.errors.push(`Error processing ${event.event_name}: ${msg}`);
        console.error(`❌ Error processing event ${event.id}:`, msg);
      }
    }

    console.log(`Lifecycle run complete:`, JSON.stringify(results));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Lifecycle engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
