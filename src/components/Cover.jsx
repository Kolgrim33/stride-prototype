import { Icon } from '../icons.jsx';
import { categoryIcon } from '../data.js';

const iconSize = { sm: 24, md: 40, lg: 56 };

// Artwork for a club or lesson. `image` is a photo URL; without one it is a tint of the category colour with its icon.
// `label` shows the category name instead of the icon.
export default function Cover({ type, size = 'md', label = false, photo, image, children }) {
  const src = image || null;
  return (
    <div className={`cover cover-${size}`} data-type={type}>
      {src ? (
        <img className="cover-img" src={src} alt="" loading="lazy" draggable="false" />
      ) : label ? (
        <span className="cover-label">{type}</span>
      ) : (
        <Icon name={categoryIcon[type] || 'grid'} size={iconSize[size]} strokeWidth={1.8} />
      )}
      {children}
    </div>
  );
}
