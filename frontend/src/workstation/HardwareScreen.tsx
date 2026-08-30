import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function HardwareScreen({ children, className = "", title, onClick, style }: Props) {
  return (
    <div className={`cockpit-screen ${className}`} onClick={onClick} style={style}>
      <div className="screen-housing">
        {title && (
          <div className="screen-title-bar">
            <span className="screen-title">{title}</span>
          </div>
        )}
        <div className="screen-content" style={{ paddingTop: title ? '44px' : '0' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
