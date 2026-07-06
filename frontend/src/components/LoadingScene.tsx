export default function LoadingScene() {
  return (
    <div className="loading-scene">
      <div className="loading-blossom-wrap">
        <svg className="loading-blossom" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} className="lb-petal" cx="50" cy="26" rx="12" ry="20" transform={`rotate(${deg} 50 50)`} />
          ))}
        </svg>
        <div className="loading-blossom-center" />
      </div>
      <p className="loading-text">
        Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
      </p>
    </div>
  );
}
