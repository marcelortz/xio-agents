# Cost Tracking Reference

> Load this on-demand when the user asks about costs or before batch operations.

## Pricing Table

| Model | Resolution | Cost/Image | Notes |
|-------|-----------|-----------|-------|
| 3.1 Flash | 512 | $0.020 | Quick drafts (512-tier price not published by Google; kept as prior estimate) |
| 3.1 Flash | 1K | $0.067 | Standard (default) |
| 3.1 Flash | 2K | $0.134 | Quality assets |
| 3.1 Flash | 4K | $0.268 | Print/hero images |
| 2.5 Flash | 512 | $0.020 | Draft fallback |
| 2.5 Flash | 1K | $0.039 | Standard fallback, budget option |
| Batch API | Any | 50% of above | Asynchronous, higher latency |

Pricing is approximate, based on ~1,290 output tokens per image. Verify at https://ai.google.dev/gemini-api/docs/pricing

## Free Tier Limits

### Images Per Month
- **100 free images per month** (reset monthly)
- Each image counts toward the limit regardless of model or resolution
- Once exhausted, standard pricing applies immediately
- No overage charges—requests simply fail with rate-limit error

⚠️ **VALIDATED BY:** `skills/banana/scripts/batch.py`  
   See: `batch.py:main()` function  
   Behavior: Shows warning if batch would exceed 100 images  
   Config source: `skills/banana/config.json`  
   Usage: `batch.py --csv file.csv` (will warn if count > 100)  
   Override: `batch.py --csv file.csv --force` (skip warning)

### API Rate Limits
- ~5-15 requests per minute (RPM)
- ~20-500 requests per day (RPD)
- Cut ~92% in Dec 2025 -- see `gemini-models.md` for the full rate-limit tier table
- Per Google Cloud project, resets midnight Pacific

## Cost Tracker Commands

```bash
# Log a generation
cost_tracker.py log --model gemini-3.1-flash-image-preview --resolution 1K --prompt "coffee shop hero"

# View summary (total + last 7 days)
cost_tracker.py summary

# Today's usage
cost_tracker.py today

# Estimate before batch
cost_tracker.py estimate --model gemini-3.1-flash-image-preview --resolution 1K --count 10

# Reset ledger
cost_tracker.py reset --confirm
```

## Storage

Ledger stored at `~/.banana/costs.json`. Created automatically on first use.
