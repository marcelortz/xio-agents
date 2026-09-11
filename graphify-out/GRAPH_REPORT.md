# Graph Report - .claude  (2026-08-31)

## Corpus Check
- Corpus is ~24,187 words - fits in a single context window. You may not need a graph.

## Summary
- 165 nodes · 169 edges · 40 communities (18 shown, 22 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Banana Gemini Models & Prompt Domains
- Banana Preset Management
- Banana Cost Tracker CLI
- Graphify Pipeline & Update Mechanics
- Banana MCP Setup Script
- Banana Cost Tracking Reference
- Graphify Extraction Spec & Step 3
- Banana Presets & Prompt Formula
- Graphify Build, Label & Health Checks
- Banana Error Handling & Safety Filters
- Banana Batch Script
- Banana Edit Script
- Banana Generate Script
- Graphify GitHub Clone & Merge
- Banana Image Config Params
- Banana Validate Setup Script
- Graphify Add/Watch Subcommand
- Graphify Query Subcommand
- Graphify Video Transcription
- Banana Search Grounding
- Banana Chat & Character Consistency
- Banana Negative Prompt Workaround
- Banana Post-Processing Tools
- Graphify Neo4j/FalkorDB Export
- Graphify Hyperedge & Similarity Rules
- Graphify Query Explain/Path Commands
- Graphify Query Feedback & Reflection
- Graphify Python Interpreter Detection
- Banana Gemini Pricing
- Banana Gemini Rate Limits
- Banana Clear Conversation Tool
- Banana Edit Image Tool
- Banana Image History Tool
- Banana Aspect Ratio Tool
- Banana Banned Keywords
- Banana Skill Community Footer
- Graphify SVG/GraphML Export
- Graphify Token Benchmark
- Graphify Step 2 Detect Files
- Graphify Step 6 HTML/Obsidian Export

## God Nodes (most connected - your core abstractions)
1. `Banana Creative Director Pipeline` - 15 edges
2. `cmd_log()` - 6 edges
3. `main()` - 6 edges
4. `_preset_path()` - 6 edges
5. `_load_ledger()` - 5 edges
6. `main()` - 5 edges
7. `load_settings()` - 5 edges
8. `remove_mcp()` - 5 edges
9. `setup_mcp()` - 5 edges
10. `Step 3 Part B - Semantic Extraction (Parallel Subagents)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `graphify claude install (Native CLAUDE.md Integration)` --conceptually_related_to--> `CLAUDE.md Graphify Skill Entry`  [INFERRED]
  skills/graphify/references/hooks.md → CLAUDE.md
- `Banana Creative Director Pipeline` --semantically_similar_to--> `Step 3 Part B - Semantic Extraction (Parallel Subagents)`  [INFERRED] [semantically similar]
  skills/banana/SKILL.md → skills/graphify/SKILL.md
- `CLAUDE.md Graphify Skill Entry` --references--> `/graphify Full Pipeline`  [EXTRACTED]
  CLAUDE.md → skills/graphify/SKILL.md
- `Banana Creative Director Pipeline` --references--> `5-Component Prompt Formula`  [EXTRACTED]
  skills/banana/SKILL.md → skills/banana/references/prompt-engineering.md
- `--mcp graphify.serve Stdio Server` --semantically_similar_to--> `gemini_generate_image tool`  [INFERRED] [semantically similar]
  skills/graphify/references/exports.md → skills/banana/references/mcp-tools.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Banana Cost Tracking Reference System** — skills_banana_references_cost_tracking_pricing_table, skills_banana_references_cost_tracking_free_tier_limits, skills_banana_references_cost_tracking_cost_tracker_cli, skills_banana_references_cost_tracking_storage [INFERRED 0.85]
- **Banana Domain Mode System** — skills_banana_references_prompt_engineering_domain_mode_cinema, skills_banana_references_prompt_engineering_domain_mode_product, skills_banana_references_prompt_engineering_domain_mode_portrait, skills_banana_references_prompt_engineering_domain_mode_editorial, skills_banana_references_prompt_engineering_domain_mode_ui_web, skills_banana_references_prompt_engineering_domain_mode_logo, skills_banana_references_prompt_engineering_domain_mode_landscape, skills_banana_references_prompt_engineering_domain_mode_infographic, skills_banana_references_prompt_engineering_domain_mode_abstract [EXTRACTED 1.00]
- **Graphify Full Pipeline Steps** — skills_graphify_skill_step0_github_clone, skills_graphify_skill_step1_python_detection, skills_graphify_skill_step2_detect_files, skills_graphify_skill_step2_5_transcribe, skills_graphify_skill_step3_extraction, skills_graphify_skill_step4_build_cluster, skills_graphify_skill_step4_5_health_check, skills_graphify_skill_step5_label_communities, skills_graphify_skill_step6_html_obsidian, skills_graphify_skill_step9_cleanup [EXTRACTED 1.00]
- **Graphify Non-Default Subcommands** — skills_graphify_skill_query_subcommand, skills_graphify_skill_update_subcommand, skills_graphify_skill_cluster_only_subcommand, skills_graphify_skill_add_watch_subcommand [EXTRACTED 1.00]

## Communities (40 total, 22 thin omitted)

### Community 0 - "Banana Gemini Models & Prompt Domains"
Cohesion: 0.10
Nodes (20): gemini-3-pro-image-preview (Deprecated/Shut Down), Key Limitations (no transparent bg, no negative prompt, no batch), gemini-3.1-flash-image-preview (Nano Banana 2), gemini-2.5-flash-image (Nano Banana Original), gemini_generate_image tool, set_model tool, Green Screen Transparency Workaround, Abstract Domain Mode (+12 more)

### Community 1 - "Banana Preset Management"
Cohesion: 0.22
Nodes (15): cmd_create(), cmd_delete(), cmd_list(), cmd_show(), _ensure_dir(), _load_preset(), main(), _preset_path() (+7 more)

### Community 2 - "Banana Cost Tracker CLI"
Cohesion: 0.25
Nodes (14): cmd_estimate(), cmd_log(), cmd_reset(), cmd_summary(), cmd_today(), _load_ledger(), _lookup_cost(), main() (+6 more)

### Community 3 - "Graphify Pipeline & Update Mechanics"
Cohesion: 0.17
Nodes (12): CLAUDE.md Graphify Skill Entry, Node ID Format Spec, graphify claude install (Native CLAUDE.md Integration), graphify hook install (Post-Commit Auto-Rebuild), build_merge() Replace-on-Re-extract, --cluster-only Command, graph_diff Old vs New Comparison, --update Incremental Re-extraction (+4 more)

### Community 4 - "Banana MCP Setup Script"
Cohesion: 0.29
Nodes (11): check_setup(), load_settings(), main(), Load Claude Code settings.json., Save Claude Code settings.json., Check if MCP is already configured., Remove MCP configuration., Configure MCP server in Claude Code settings. (+3 more)

### Community 5 - "Banana Cost Tracking Reference"
Cohesion: 0.33
Nodes (7): Gemini 2.5 Flash (image model), Gemini 3.1 Flash (image model), Batch API (image generation), Cost Tracker CLI Commands, Free Tier Limits, Pricing Table, Cost Ledger Storage

### Community 6 - "Graphify Extraction Spec & Step 3"
Cohesion: 0.33
Nodes (7): EXTRACTED/INFERRED/AMBIGUOUS Confidence Rubric, Extraction Subagent JSON Schema, Step 3 B0 - Extraction Cache Check, Step 3 - Extract Entities and Relationships, Step 3 Part A - Structural (AST) Extraction, Step 3 Part B - Semantic Extraction (Parallel Subagents), Step 9 - Save Manifest, Cost Tracker, Cleanup, Report

### Community 7 - "Banana Presets & Prompt Formula"
Cohesion: 0.33
Nodes (6): editorial-magazine preset, luxury-brand preset, Brand/Style Preset JSON Schema, tech-saas preset, 5-Component Prompt Formula, Reasoning Brief Construction

### Community 8 - "Graphify Build, Label & Health Checks"
Cohesion: 0.40
Nodes (5): Honesty Rules, Step 4.5 - Graph Health Check, Step 4 - Build Graph, Cluster, Analyze, Step 5 - Label Communities, PowerShell Scrolling Bug (graspologic ANSI)

### Community 9 - "Banana Error Handling & Safety Filters"
Cohesion: 0.67
Nodes (4): Gemini Safety Filter Architecture, MCP Error Response Taxonomy, Safety Filter Rephrase Strategies, Banana Error Handling Table

### Community 10 - "Banana Batch Script"
Cohesion: 0.67
Nodes (3): estimate_cost(), main(), Estimate cost for a single image.

### Community 11 - "Banana Edit Script"
Cohesion: 0.67
Nodes (3): edit_image(), main(), Call Gemini API to edit an image.

### Community 12 - "Banana Generate Script"
Cohesion: 0.67
Nodes (3): generate_image(), main(), Call Gemini API to generate an image.

### Community 13 - "Graphify GitHub Clone & Merge"
Cohesion: 0.67
Nodes (4): graphify clone Single Repo, graphify merge-graphs Cross-Repo Merge, Monorepo Multi-Subfolder Extraction, Step 0 - GitHub Clone / Multi-path Merge

### Community 14 - "Banana Image Config Params"
Cohesion: 0.67
Nodes (3): Supported Aspect Ratios (14 ratios), imageSize Resolution Tiers, ImageConfig Parameter Reference

### Community 16 - "Graphify Add/Watch Subcommand"
Cohesion: 0.67
Nodes (3): /graphify add URL Ingestion, --watch Folder Watcher, /graphify add and --watch Subcommands

### Community 17 - "Graphify Query Subcommand"
Cohesion: 0.67
Nodes (3): BFS/DFS Traversal Modes, Constrained Query Vocabulary Expansion, /graphify query Subcommand

### Community 18 - "Graphify Video Transcription"
Cohesion: 1.00
Nodes (3): Domain Hint Prompt for Whisper, Whisper Video/Audio Transcription, Step 2.5 - Video/Audio Transcription

## Knowledge Gaps
- **60 isolated node(s):** `Free Tier Limits`, `Cost Ledger Storage`, `Batch API (image generation)`, `gemini-2.5-flash-image (Nano Banana Original)`, `Supported Aspect Ratios (14 ratios)` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Banana Creative Director Pipeline` connect `Banana Gemini Models & Prompt Domains` to `Banana Cost Tracking Reference`, `Graphify Extraction Spec & Step 3`, `Banana Presets & Prompt Formula`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `Step 3 Part B - Semantic Extraction (Parallel Subagents)` connect `Graphify Extraction Spec & Step 3` to `Banana Gemini Models & Prompt Domains`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Extraction Subagent JSON Schema` connect `Graphify Extraction Spec & Step 3` to `Graphify Pipeline & Update Mechanics`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `main()` (e.g. with `cmd_estimate()` and `cmd_log()`) actually correct?**
  _`main()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Free Tier Limits`, `Cost Ledger Storage`, `Batch API (image generation)` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Banana Gemini Models & Prompt Domains` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._