// Free-to-use stock photos (CC0 or public domain) of objects only, no faces and no text. Decorative.
const files = { pitch: 'pitch.jpg', chess: 'chess.jpg', circuit: 'circuit.jpg', notebook: 'notebook.jpg' };

export default function Photo({ name = 'notebook', tall = false }) {
  return <img className={`photo${tall ? ' photo-tall' : ''}`} src={`/img/${files[name]}`} alt="" width="1000" height="667" loading="eager" draggable="false" />;
}
