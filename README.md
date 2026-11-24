# TMDB Collection First
AIOStreams similar catalog for movies. Uses TMDB collection parts in chronological release order, followed by recommendations, excluding the current movie and duplicates. Returns tmdb: IDs, supported by AIOMetadata. No playback or home catalogs.

## Render
Create a GitHub repository and upload these files at its root. Create a Render Web Service from it (Node runtime, free plan if available). Build: `npm test`; start: `npm start`. Set secret environment variable `TMDB_API_KEY` to your TMDB v3 key (or `TMDB_TOKEN` to your read access token). Never commit secrets. Set `TMDB_LANGUAGE=sk-SK` (optional). Health endpoint `/health` reports whether credentials are present, not whether they are valid.

Install the deployed HTTPS URL ending in `/manifest.json` as a custom addon in AIOStreams. Place before AIOMetadata. Save and reconnect client if needed. Test `/catalog/movie/similar/similar=tt0112442.json` (Bad Boys). Local tests use mocked TMDB responses; live TMDB and client compatibility must be checked after deployment. If the app ignores the similar catalog or reorders results, client behavior needs separate investigation.

This product uses the TMDB API but is not endorsed or certified by TMDB. https://www.themoviedb.org/
