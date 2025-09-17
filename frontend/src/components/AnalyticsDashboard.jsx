const AnalyticsDashboard = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 My Analytics Dashboard</h1>

      <section style={{ marginTop: "20px" }}>
        <h2>Google Ads Insights</h2>
        <iframe
          src="YOUR_LOOKER_STUDIO_EMBED_URL"
          width="100%"
          height="600"
          frameBorder="0"
          title="Google Ads Dashboard"
        />
      </section>

      <section style={{ marginTop: "20px" }}>
        <h2>AWS QuickSight</h2>
        <iframe
          src="YOUR_QUICKSIGHT_EMBED_URL"
          width="100%"
          height="600"
          frameBorder="0"
          title="AWS QuickSight Dashboard"
        />
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
