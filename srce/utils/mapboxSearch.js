import Constants from "expo-constants";


const MAPBOX_PUBLIC_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN;


const GEOCODING_BASE_URL =
  "https://api.mapbox.com/search/geocode/v6";


const DEFAULT_COUNTRIES =
  "at,de,ch";

const DEFAULT_LANGUAGE =
  "de";


if (!MAPBOX_PUBLIC_TOKEN) {
  console.warn(
    "MAPBOX_PUBLIC_TOKEN is missing"
  );
}


/**
 * ============================================================
 * ADDRESS SUGGESTIONS
 * ============================================================
 *
 * Verwendet Mapbox Geocoding API v6.
 *
 * Wichtig:
 * - autocomplete = true
 * - permanent = false
 *
 * Die Vorschläge werden nur angezeigt und NICHT gespeichert.
 *
 * sessionToken bleibt als Parameter erhalten, damit
 * AddressAutosuggest.js nicht geändert werden muss.
 * Die Geocoding API v6 benötigt ihn aber nicht.
 */
export async function suggestAddresses(
  query,
  sessionToken,
  options = {}
) {

  const normalizedQuery =
    query?.trim();


  if (
    !normalizedQuery ||
    normalizedQuery.length < 3
  ) {
    return [];
  }


  const params =
    new URLSearchParams({
      q: normalizedQuery,

      access_token:
        MAPBOX_PUBLIC_TOKEN,

      country:
        options.countries ||
        DEFAULT_COUNTRIES,

      language:
        options.language ||
        DEFAULT_LANGUAGE,

      limit: String(
        options.limit || 5
      ),

      types: "address",

      autocomplete: "true",

      /*
       * Vorschläge werden nicht gespeichert.
       */
      permanent: "false",
    });


  /*
   * Optional Ergebnisse in Richtung
   * aktueller Standort priorisieren.
   */
  if (
    options.proximityLongitude != null &&
    options.proximityLatitude != null
  ) {

    params.set(
      "proximity",
      `${options.proximityLongitude},${options.proximityLatitude}`
    );
  }


  const response =
    await fetch(
      `${GEOCODING_BASE_URL}/forward?${params.toString()}`
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Mapbox geocoding suggest failed:",
      response.status,
      errorText
    );

    throw new Error(
      `Mapbox geocoding suggest failed: ${response.status}`
    );
  }


  const data =
    await response.json();


  /*
   * Geocoding v6 liefert GeoJSON Features.
   *
   * Wir normalisieren sie so, dass dein bestehendes
   * AddressAutosuggest weiterhin mit:
   *
   * item.mapbox_id
   * item.address
   * item.context
   *
   * arbeiten kann.
   */
  return (
    data.features ?? []
  )
    .map((feature) => {

      const props =
        feature.properties ?? {};

      return {
        mapbox_id:
          props.mapbox_id,

        /*
         * props.name enthält bei address-Features
         * z.B. "Hauptstraße 12".
         */
        address:
          props.name || "",

        name:
          props.name || "",

        full_address:
          props.full_address || "",

        place_formatted:
          props.place_formatted || "",

        context:
          props.context ?? {},
      };
    })
    .filter(
      (item) =>
        !!item.mapbox_id
    );
}


/**
 * ============================================================
 * RETRIEVE SELECTED ADDRESS
 * ============================================================
 *
 * Wird erst aufgerufen, nachdem der User einen Vorschlag
 * tatsächlich ausgewählt hat.
 *
 * WICHTIG:
 *
 * permanent = true
 *
 * Genau dieses Ergebnis wird anschließend dauerhaft
 * in tb_address gespeichert.
 *
 * Mapbox Geocoding v6 erlaubt Permanent Storage,
 * wenn permanent=true gesetzt wurde.
 *
 * sessionToken bleibt nur aus Kompatibilitätsgründen
 * mit AddressAutosuggest im Funktionsparameter.
 */
export async function retrieveAddress(
  mapboxId,
  sessionToken
) {

  if (!mapboxId) {
    throw new Error(
      "Mapbox ID is missing"
    );
  }


  /*
   * Laut Mapbox kann eine mapbox_id wiederum
   * als Forward-Geocoding-Suche verwendet werden,
   * um genau dieses Feature zurückzubekommen.
   */
  const params =
    new URLSearchParams({

      q: mapboxId,

      access_token:
        MAPBOX_PUBLIC_TOKEN,

      language:
        DEFAULT_LANGUAGE,

      limit: "1",

      types: "address",

      autocomplete: "false",

      /*
       * ENTSCHEIDEND:
       *
       * Dieses Ergebnis soll dauerhaft
       * in unserer Datenbank gespeichert werden.
       */
      permanent: "true",
    });


  const response =
    await fetch(
      `${GEOCODING_BASE_URL}/forward?${params.toString()}`
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Mapbox permanent geocoding failed:",
      response.status,
      errorText
    );

    throw new Error(
      `Mapbox permanent geocoding failed: ${response.status}`
    );
  }


  const data =
    await response.json();

  const feature =
    data.features?.[0];


  if (!feature) {

    throw new Error(
      "Mapbox permanent geocoding returned no feature"
    );
  }


  const props =
    feature.properties ?? {};

  const context =
    props.context ?? {};


  /*
   * Geocoding v6 stellt Koordinaten sowohl
   * in properties.coordinates als auch
   * im GeoJSON geometry-Objekt bereit.
   */
  const longitude =
    props.coordinates?.longitude ??
    feature.geometry?.coordinates?.[0];

  const latitude =
    props.coordinates?.latitude ??
    feature.geometry?.coordinates?.[1];


  /*
   * ISO-3166 Alpha-2, z.B.:
   *
   * AT
   * DE
   * CH
   */
  const countryCode =
    context.country
      ?.country_code
      ?.toUpperCase() ||
    "";


  /*
   * Stadt/Ort.
   *
   * Normalerweise context.place.
   * locality als Fallback.
   */
  const city =
    (
      context.place?.name ||
      context.locality?.name ||
      ""
    ).trim();


  const postalCode =
    (
      context.postcode?.name ||
      ""
    ).trim();


  /*
   * Für address-Features ist props.name
   * bereits die formatierte Kombination
   * aus Hausnummer + Straße.
   *
   * Beispiel:
   * "Hauptstraße 12"
   */
  const streetNumber =
    (
      props.name ||
      ""
    ).trim();


  const result = {

    streetNumber,

    postalCode,

    city,

    country:
      countryCode,

    mapboxId:
      props.mapbox_id ||
      mapboxId,

    latitude,

    longitude,
  };


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const requiredFields = [
    "streetNumber",
    "postalCode",
    "city",
    "country",
    "mapboxId",
  ];


  const missingFields =
    requiredFields.filter(
      (field) =>
        !result[field]
    );


  if (
    missingFields.length > 0 ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {

    console.error(
      "Incomplete Mapbox geocoding result:",
      {
        missingFields,
        result,
        properties: props,
      }
    );


    throw new Error(
      `Unvollständige Mapbox-Adresse: ${
        missingFields.join(", ")
      }`
    );
  }


  return result;
}