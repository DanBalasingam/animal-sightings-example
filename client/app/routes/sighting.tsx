import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Sighting } from '../types';
import { api } from '../lib/api';

export default function SightingDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<Sighting | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    if (!id) {
      setError(new Error('No sighting id given'));
      return;
    }

    api<Sighting[]>(`/sightings?id=${encodeURIComponent(id)}`, { method: 'GET' })
      .then((sightings) => {
        if (cancelled) return;
        const sighting = sightings[0];
        if (sighting) setData(sighting);
        else setError(new Error('Sighting not found'));
      })
      .catch((e) => {
        if (!cancelled && e.name !== 'AbortError') setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error || !data) {
    return (
      <div className="container">
        <div className="sighting-content">
          <Link to="/sightings" className="back-link">&larr; Back to sightings</Link>
          {error ? <h4>{error.message}</h4> : <p>Loading sighting...</p>}
        </div>
      </div>
    );
  }

  const threatClass = data.threat_category?.toLowerCase().replace(/\s+/g, '-');
  const dateFormat = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const humanReadableSD = dateFormat.format(new Date(data.sighting_datetime));
  const humanReadableCA = dateFormat.format(new Date(data.created_at));
  const terrainFeatures = (data.terrain_features ?? '')
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=13/${data.latitude}/${data.longitude}`;
  const observer = data.observer_name ?? 'Anonymous';

  return (
    <div className="container">
      <div className="sighting-content">
        <Link to="/sightings" className="back-link">&larr; Back to sightings</Link>
        <div className="sighting-header">
          <span className={`tag threat-tag ${threatClass}`}>
            {data.threat_category}
          </span>
          <h1>{data.common_name} near {data.location_name}</h1>
          <p>Seen {humanReadableSD} &middot; recorded by {observer}</p>
        </div>
        <div className="sighting-body">
          <div className="sighting-column">
            <div className="sighting-card image-card">
              {data.sighting_image
                ? <img src={`/api/v1/images/${data.sighting_image}`} alt={`${data.common_name} sighting`} />
                : <div className="no-photo">No photo</div>
              }
              <p className="image-caption">Photo: {observer}</p>
            </div>
            <div className="sighting-card">
              <h4 className="card-label">Observer notes</h4>
              <p>{data.notes || 'No notes recorded.'}</p>
            </div>
          </div>
          <div className="sighting-column">
            <div className="sighting-card">
              <h4 className="card-label">Species</h4>
              <h3>{data.common_name}</h3>
              <p>{data.maori_name || 'No Māori name recorded'}</p>
              <p className="italics">{data.scientific_name}</p>
              <dl className="detail-grid">
                <div>
                  <dt>Category</dt>
                  <dd>{data.species_category}</dd>
                </div>
                <div>
                  <dt>Threat status</dt>
                  <dd>{data.threat_category}</dd>
                </div>
                <div>
                  <dt>Population estimate</dt>
                  <dd>{data.population_estimate}</dd>
                </div>
                <div>
                  <dt>Year assessed</dt>
                  <dd>{data.year_assessed}</dd>
                </div>
              </dl>
            </div>
            <div className="sighting-card">
              <h4 className="card-label">Location</h4>
              <h3>{data.location_name}</h3>
              <p>{data.region} region</p>
              <p className="coords">
                {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)} &middot; <a href={mapUrl} target="_blank" rel="noreferrer">Open map</a>
              </p>
              {terrainFeatures.length > 0 && (
                <>
                  <p className="terrain-label">Terrain features</p>
                  <div className="card-tags">
                    {terrainFeatures.map((feature) => (
                      <span key={feature} className="tag feature-tag">{feature}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="sighting-card">
              <h4 className="card-label">Record</h4>
              <dl className="detail-grid">
                <div>
                  <dt>Number seen</dt>
                  <dd>{data.num_seen}</dd>
                </div>
                <div>
                  <dt>Seen</dt>
                  <dd>{humanReadableSD}</dd>
                </div>
                <div>
                  <dt>Observer</dt>
                  <dd>{observer}</dd>
                </div>
                <div>
                  <dt>Recorded</dt>
                  <dd>{humanReadableCA}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
