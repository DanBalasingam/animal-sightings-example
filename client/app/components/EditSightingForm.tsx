import { useState, useEffect, useMemo, type FormEvent } from "react";
import type { Specie, Location, Sighting } from '../types';
import { api, ApiError } from '../lib/api';
import { Autocomplete, type AutocompleteOption } from "./Autocomplete";

type EditSightingFormProps = {
  sighting: Sighting;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditSightingForm({ sighting, onSaved, onCancel }: EditSightingFormProps) {
  const [species, setSpecies] = useState<Specie[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [nameQuery, setNameQuery] = useState(sighting.common_name);
  const [locationQuery, setLocationQuery] = useState(sighting.location_name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Specie[]>('/species', { method: 'GET' })
      .then((data) => setSpecies(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    api<Location[]>('/locations', { method: 'GET' })
      .then((data) => setLocations(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
  }, []);

  const specieOptions = useMemo<AutocompleteOption[]>(
    () => species.map((r) => ({
      label: r.common_name,
      aliases: [r.maori_name, r.scientific_name].filter(Boolean),
      hint: [r.maori_name, r.scientific_name].filter(Boolean).join(" · "),
    })),
    [species]
  );

  const locationOptions = useMemo<AutocompleteOption[]>(
    () => [...new Map(locations.map((r) => [r.name, r])).values()].map((r) => ({
      label: r.name,
      aliases: [r.region].filter(Boolean),
      hint: [r.region].filter(Boolean).join(" . "),
    })),
    [locations]
  );

  const speciesId = nameQuery === sighting.common_name
    ? sighting.species_id
    : species.find((s) => s.common_name === nameQuery)?.id;
  const locationId = locationQuery === sighting.location_name
    ? sighting.location_id
    : locations.find((l) => l.name === locationQuery)?.id;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!speciesId) return setError('Please pick a species from the list');
    if (!locationId) return setError('Please pick a location from the list');

    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api(`/sightings/${sighting.id}`, {
        method: 'PUT',
        body: {
          species_id: speciesId,
          location_id: locationId,
          individual_count: Number(form.get('individual_count')),
          datetime: String(form.get('datetime') ?? ''),
          notes: String(form.get('notes') ?? ''),
        },
      });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save sighting');
      setSaving(false);
    }
  }

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className='error-box'><p role="alert">⚠ {error}</p></div>}
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
            <input
              type="datetime-local"
              name="datetime"
              defaultValue={sighting.sighting_datetime.slice(0, 16)}
              max={new Date().toISOString().slice(0, 16)}
              required={true}
            />
          </div>
          <div className="num-seen-col">
            <label>Number seen *</label>
            <input type="number" name="individual_count" min={1} defaultValue={sighting.num_seen} required={true} />
          </div>
        </fieldset>
        <fieldset>
          <div>
            <label>Notes</label>
            <p>(optional)</p>
          </div>
          <textarea name="notes" rows={4} defaultValue={sighting.notes ?? ''} />
        </fieldset>
        <div className="edit-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}><span>{saving ? 'Saving...' : 'Save changes'}</span></button>
        </div>
      </form>
    </div>
  );
}
