import { Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import type { Specie, Location } from '../types';
import { api } from '../lib/api';
import { Autocomplete, type AutocompleteOption } from "../components/Autocomplete";


export default function Report() {
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

  const locationOptions = useMemo<AutocompleteOption[]>(
    () => locations.map((r) => ({
      label: r.name,
      aliases: [r.region].filter(Boolean),
      hint: [r.region].filter(Boolean).join(" . "),
    })),
    [locations]
  )

  return (
    <div className="container">
      <div className="report-content">
        <Link to="/sightings" style={{ textDecoration: "none", cursor: "pointer", color: "#404E3B", display: "block", textAlign: "right" }}>&larr; Back to sightings</Link>
        <h1>Report a sighting</h1>
        <div className="report-form-container">
          <form>
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
                <input type="date" required={true} />
              </div>
              <div className="num-seen-col">
                <label>Number seen *</label>
                <input type="number" required={true} />
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
          </form>
        </div>
      </div>
    </div>
  );
}
