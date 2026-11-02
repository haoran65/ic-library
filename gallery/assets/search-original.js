window.IC_LEGACY_MATCHER = function(ctx){
const {state,VENUES,PATTERNS,patLabel,TIERS,tierLabel}=ctx;
function matches(f) {
    if (state.venue !== "all" && f.venue !== state.venue) return false;
    if (state.year !== "all" && String(f.year) !== String(state.year)) return false;
    if (state.pattern !== "all" && f.pattern !== state.pattern) return false;
    if (state.tier === "best") { if (!f.award) return false; }
    else if (state.tier === "oral") { if (f.award || f.tier !== "oral") return false; }
    else if (state.tier === "spotlight") { if (f.award || f.tier !== "spotlight") return false; }
    if (state.q) {
      const hay = [f.title, (f.authors || []).join(" "), VENUES[f.venue].name,
                   f.year, f.pattern, PATTERNS[f.pattern] || "", patLabel(f.pattern),
                   f.tier ? TIERS[f.tier] : "", f.tier ? tierLabel(f.tier) : "",
                   f.award ? "best paper award outstanding 最佳论文" : ""]
        .join(" ").toLowerCase();
      if (!state.q.split(/\s+/).every((tok) => hay.includes(tok))) return false;
    }
    return true;
  }
return matches;
};
