import { Link } from "react-router";


export default function Report() {

  return (
    <div className="container">
      <div className="report-content">
        <Link to="/sightings" style={{ textDecoration: "none", cursor: "pointer", color: "#404E3B", display: "block", textAlign: "right" }}>&larr; Back to sightings</Link>
        <h1>Report a sighting</h1>
        <div className="report-form-container">
          <form>
            <fieldset>
              <label>Species *</label>
              <input type="text" required={true} placeholder="Enter species" />
              <p>Type part of any name. (Macrons are optional)</p>
            </fieldset>
            <fieldset>
              <label>Location *</label>
              <input type="text" required={true} placeholder="E.g. Westport, West Coast" />
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
              <input type="text" />
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
