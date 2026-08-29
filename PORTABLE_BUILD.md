# Building the portable Conforecast bundle

The downloadable `conforecast-complete-source.zip` is self-contained. It includes the full React application, configuration, documentation, and compact local copies of the three visual assets used by the interface. In the portable code, those assets are referenced from `client/public/assets/`; no project-specific image URL is required.

## Run the application

```bash
pnpm install
pnpm dev
```

The terminal prints a local web address. Open it in a modern browser. Live weather and city lookup require internet access to Open-Meteo.

## Create a production build

```bash
pnpm build
pnpm start
```

## Verify the source

```bash
pnpm check
```

The client deliberately keeps API calls in the browser. This removes the need for a server-side API key, but browser users must have network access to the public forecast and geocoding endpoints.
