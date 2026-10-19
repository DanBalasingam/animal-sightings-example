import { Link, useNavigate, useSearchParams } from 'react-router';
import type { Sighting, Specie } from '../types';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import "../shared.css";
import "./species_info.css";

const numberFormat = new Intl.NumberFormat('en-NZ');
const dateFormat = new Intl.DateTimeFormat('en-NZ', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function mostCommonRegion(sightings: Sighting[]) {
  const counts = new Map<string, number>();
  for (const s of sightings) counts.set(s.region, (counts.get(s.region) ?? 0) + 1);
  let best: string | null = null;
  for (const [region, count] of counts) {
    if (best === null || count > counts.get(best)!) best = region;
  }
  return best;
}

export default function SpeciesInfo() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [result, setResult] = useState<{ id: string; specie?: Specie; sightings?: Sighting[]; error?: Error } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const param = encodeURIComponent(id);
    Promise.all([
      api<Specie[]>(`/species?id=${param}`, { method: 'GET' }),
      api<Sighting[]>(`/sightings?species_id=${param}`, { method: 'GET' }),
    ])
      .then(([[specie], sightings]) => {
        if (cancelled) return;
        setResult(specie ? { id, specie, sightings } : { id, error: new Error('Specie not found') });
      })
      .catch((e) => {
        if (!cancelled && e.name !== 'AbortError') setResult({ id, error: e })
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const current = result?.id === id ? result : null;
  const error = id ? current?.error : new Error('No specie id given');
  const specie = current?.specie;
  const sightings = current?.sightings ?? [];

  if (error || !specie) {
    return (
      <div className='container'>
        <div className='species-info-content'>
          <Link to="/species" className='back-link'>&larr; Back to species</Link>
          {error ? <h4>{error.message}</h4> : <p>Loading specie...</p>}
        </div>
      </div>
    );
  }

  const threatClass = specie.threat_category?.toLowerCase().replace(/\s+/g, '-');
  const individuals = sightings.reduce((sum, s) => sum + s.num_seen, 0);
  const lastSeen = sightings.reduce<string | null>(
    (latest, s) => (latest === null || s.sighting_datetime > latest ? s.sighting_datetime : latest),
    null,
  );
  const heroImage = sightings.find((s) => s.sighting_image)?.sighting_image;

  return (
    <div className="container">
      <title>{`${specie.common_name} | NZ Animal Sightings`}</title>
      <div className='species-info-content'>
        <Link to="/species" className="back-link">&larr; Back to species</Link>
        <div className='specie-details'>
          <div className='specie-img'>
            {heroImage
              ? <img src={`/api/v1/images/${heroImage}`} alt={specie.common_name} />
              : <span className='specie-img-placeholder'>{specie.common_name.charAt(0)}</span>}
          </div>
          <div className='specie-info'>
            <div className='threat-category'>
              <span className={`tag threat-tag ${threatClass}`}>
                {specie.threat_category}
              </span>
            </div>
            <h2>{specie.common_name}</h2>
            {specie.maori_name && <h5>{specie.maori_name}</h5>}
            <p className='italics'>{specie.scientific_name}</p>
            <div className='specie-grid'>
              <div className='grid-item'>
                <p>Category</p>
                <strong>{specie.species_category}</strong>
              </div>
              <div className='grid-item'>
                <p>Population estimate</p>
                <strong>{specie.population_estimate != null ? numberFormat.format(specie.population_estimate) : '-'}</strong>
              </div>
              <div className='grid-item'>
                <p>Threat status</p>
                <strong>{specie.threat_category}</strong>
              </div>
              <div className='grid-item'>
                <p>Sightings recorded</p>
                <strong>{numberFormat.format(specie.sightings)}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className='sightings-heading'>
          <h4>Sightings of this species</h4>
          <Link to="/sightings" className='sightings-link'>See all sightings &rarr;</Link>
        </div>
        <div className='specie-sightings'>
          <div className='sightings-kpis'>
            <div className='kpi-card'>
              <p>Sightings</p>
              <strong>{numberFormat.format(sightings.length)}</strong>
            </div>
            <div className='kpi-card'>
              <p>Individuals counted</p>
              <strong>{numberFormat.format(individuals)}</strong>
            </div>
            <div className='kpi-card'>
              <p>Most common region</p>
              <strong>{mostCommonRegion(sightings) ?? '-'}</strong>
            </div>
            <div className='kpi-card'>
              <p>Last seen</p>
              <strong>{lastSeen ? dateFormat.format(new Date(lastSeen)) : '-'}</strong>
            </div>
          </div>
          {sightings.length === 0 ? (
            <p className='no-sightings'>No sightings of this species have been reported yet.</p>
          ) : (
            <div className='table-wrapper'>
              <table>
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Notes</th>
                    <th>Individuals</th>
                    <th>Seen at</th>
                    <th>Reported by</th>
                  </tr>
                </thead>
                <tbody>
                  {sightings.map((s) => (
                    <tr key={s.id} className='sighting-row' onClick={() => navigate(`/sighting?id=${s.id}`)}>
                      <td>
                        <Link to={`/sighting?id=${s.id}`} className='region row-link'>{s.region}</Link>
                        <small>{s.location_name}</small>
                      </td>
                      <td className='notes'>{s.notes || '-'}</td>
                      <td>{numberFormat.format(s.num_seen)}</td>
                      <td>{dateFormat.format(new Date(s.sighting_datetime))}</td>
                      <td>{s.observer_name ?? 'Anonymous'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
