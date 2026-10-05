import { Form, Link, redirect, useNavigation } from "react-router";
import { useState, useEffect, useMemo } from "react";
import type { Route } from './+types/report';
import type { Specie, Location, SightingRequest, SightingResponse } from '../types';
import { api, ApiError } from '../lib/api';
import { Autocomplete, type AutocompleteOption } from "../components/Autocomplete";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const species_id = Number(form.get('species_id'));
  const location_id = Number(form.get('location_id'));
  if (!species_id) return { error: 'Please pick a species from the list' };
  if (!location_id) return { error: 'Please pick a location from the list' };
  const body: SightingRequest = {
    species_id,
    location_id,
    individual_count: Number(form.get('individual_count')),
    datetime: String(form.get('datetime') ?? ''),
    notes: String(form.get('notes') ?? ''),
  };
  try {
    await api<SightingResponse>('/sightings', { method: 'POST', body });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  return redirect('/sightings');
}

export default function Report({ actionData }: Route.ComponentProps) {
  const submitting = useNavigation().state === 'submitting';
  const [species, setSpecies] = useState<Specie[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [nameQuery, setNameQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api<Specie[]>('/species', { method: 'GET' })
      .then((data) => setSpecies(data))
      .catch ((e) => {
        if (e.name !== 'AbortError') setError(e);
      })
    api<Location[]>('/locations', { method: 'GET' })
      .then((data) => setLocations(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      })
  }, [])

  const specieOptions = useMemo<AutocompleteOption[]>(
    () => species.map((r) => ({
      label: r.common_name,
      aliases: [r.maori_name, r.scientific_name].filter(Boolean),
      hint: [r.maori_name, r.scientific_name].filter(Boolean).join(" · "),
    })),
    [species]
  );

  // Some locations share a name, so only list each name once
  const locationOptions = useMemo<AutocompleteOption[]>(
    () => [...new Map(locations.map((r) => [r.name, r])).values()].map((r) => ({
      label: r.name,
      aliases: [r.region].filter(Boolean),
      hint: [r.region].filter(Boolean).join(" . "),
    })),
    [locations]
  )

  // Map the typed names back to ids for the request
  const speciesId = species.find((s) => s.common_name === nameQuery)?.id ?? '';
  const locationId = locations.find((l) => l.name === locationQuery)?.id ?? '';

  return (
    <div className="container">
      <div className="report-content">
        <Link to="/sightings" style={{ textDecoration: "none", cursor: "pointer", color: "#404E3B", display: "block", textAlign: "right" }}>&larr; Back to sightings</Link>
        <h1>Report a sighting</h1>
        <div className="report-form-container">
          <Form method="post">
            {(actionData?.error || error) && <div className='error-box'><p role="alert">⚠ {actionData?.error ?? error?.message}</p></div>}
            <input type="hidden" name="species_id" value={speciesId} />
            <input type="hidden" name="location_id" value={locationId} />
            <fieldset>
              <label>Species *</label>
              <Autocomplete options={specieOptions} value={nameQuery} onChange={setNameQuery} placeholder="Enter species" />
              <p>Type part of any name. (Macrons are optional)</p>
            </fieldset>
            <fieldset>
              <label>Location *</label>
              <Autocomplete options={locationOptions} value={locationQuery} onChange={setLocationQuery} placeholder="E.g. Westport, West Coast" />
            </fieldset>
            <fieldset className="form-grid">
              <div className="date-col">
                <label>Date and time seen *</label>
                <input type="datetime-local" name="datetime" max={new Date().toISOString().slice(0, 16)} required={true} />
              </div>
              <div className="num-seen-col">
                <label>Number seen *</label>
                <input type="number" name="individual_count" min={1} defaultValue={1} required={true} />
              </div>
            </fieldset>
            <fieldset>
              <div>
                <label>Notes</label>
                <p>(optional)</p>
              </div>
              <textarea id="notes" name="notes" rows={4} />
            </fieldset>
            <fieldset>
              <div>
                <label>Photo</label>
                <p>(optional)</p>
              </div>
              <input type="file" />
            </fieldset>
            <button type="submit" className="btn btn-primary" disabled={submitting}><span>Submit sighting</span></button>
          </Form>
        </div>
      </div>
    </div>
  );
}
