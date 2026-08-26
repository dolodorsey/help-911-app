# H911 local SDR radio listener

The preferred zero-subscription path is:

`RTL-SDR receiver(s) → SDRTrunk or Trunk Recorder → call audio directory → local whisper.cpp → Supabase`

The worker watches the call-audio directory, transcribes locally, stores every transcript in
`h911_scanner_transcripts`, and creates an `h911_accident_leads` row when crash keywords appear.
Its SQLite ledger makes ingestion restart-safe and prevents duplicate Supabase records.

Keep `~/.h911_config.json` outside source control. Local SDR mode needs:

```json
{
  "supabase_url": "https://PROJECT.supabase.co",
  "supabase_key": "SERVER_SIDE_SECRET_KEY",
  "recordings_dir": "/path/to/trunk-recorder/audio",
  "default_feed_id": "atlanta-p25",
  "default_feed_name": "Atlanta Metro Public Safety",
  "default_county": "Fulton",
  "systems": {
    "atlanta": {"feed_id": "atlanta-p25", "feed_name": "Atlanta Public Safety", "county": "Fulton"},
    "dekalb": {"feed_id": "dekalb-p25", "feed_name": "DeKalb Public Safety", "county": "DeKalb"}
  },
  "whisper_cpu_only": true,
  "transcription_workers": 2
}
```

For the existing Help 911 Mac service, `recordings_dir` defaults to
`~/Desktop/TERMINAL/h911-radio/recordings`, so the previous secret-bearing config does not need to
be rewritten. Set `H911_RECORDINGS_DIR` only when the decoder writes somewhere else.

For multiple radio systems, configure Trunk Recorder to place calls under matching subdirectories
such as `audio/atlanta/` and `audio/dekalb/`. Add receivers without changing the ingestion worker;
it drains up to 50 stable recordings per batch and deduplicates audio across restarts.
Built-in directory mappings cover `atlanta`, `dekalb`, `cobb`, `coweta`, and `spalding`.

The existing `whisper.cpp` CLI and `ggml-base.en.bin` model under `~/Desktop/TERMINAL/whisper.cpp`
are detected automatically. `openai_api_key` is optional and is only a fallback when local Whisper
is unavailable.

Run `python workers/h911_scanner.py` interactively once. It verifies Supabase, the recordings
directory, ffmpeg, and local Whisper before starting. Install or restart the LaunchAgent only after
preflight succeeds. Monitor only unencrypted traffic that you are legally permitted to receive.
